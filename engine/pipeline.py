"""Main pipeline orchestrator for motion typography rendering."""

import numpy as np
import torch
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple
from tqdm import tqdm
from loguru import logger

from engine.core.types import Transcript, StyleConfig, Timeline, Frame, Word, Segment
from engine.core.config import Config
from engine.core.exceptions import RenderError, GPUError
from engine.dsl.parser import parse_transcript, parse_styles
from engine.dsl.validator import validate_transcript, validate_styles
from engine.dsl.keyframes import KeyframeInterpolator
from engine.render.skia_renderer import SkiaRenderer
from engine.gpu.device_manager import DeviceManager
from engine.gpu.effects.blur import GaussianBlur
from engine.gpu.effects.glow import GlowEffect
from engine.gpu.utils import transfer_to_gpu, transfer_to_cpu
from engine.video.ffmpeg_encoder import FFmpegEncoder
from engine.video.video_reader import VideoReader


class MotionTypographyEngine:
    """Main engine for motion typography video rendering."""

    def __init__(
        self,
        resolution: Tuple[int, int] = (1920, 1080),
        fps: int = 60,
        device: Optional[str] = None,
    ):
        """Initialize the motion typography engine."""
        self.resolution = resolution
        self.fps = fps
        self.device_manager = DeviceManager(device)
        self.device = self.device_manager.get_device()

        # Configure logging
        logger.remove()
        logger.add(
            lambda msg: print(msg, end=""),
            level=Config.LOG_LEVEL,
            format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>",
        )

    def compile(
        self, transcript: Transcript, styles: StyleConfig
    ) -> Timeline:
        """Compile transcript and styles into a timeline."""
        logger.info("Compiling timeline...")

        # Validate inputs
        validate_transcript(transcript)
        validate_styles(styles)

        # Override resolution and fps from styles if provided
        if styles.resolution:
            self.resolution = styles.resolution
        if styles.fps:
            self.fps = styles.fps

        # Build timeline
        frames = []
        frame_duration = 1.0 / self.fps
        current_time = 0.0
        total_frames = int(transcript.duration * self.fps) + 1

        for frame_idx in range(total_frames):
            current_time = frame_idx * frame_duration
            elements = self._get_elements_at_time(transcript, styles, current_time)
            frames.append(Frame(timestamp=current_time, elements=elements))

        logger.info(f"Compiled {len(frames)} frames")
        return Timeline(
            frames=frames,
            duration=transcript.duration,
            fps=self.fps,
            resolution=self.resolution,
            styles=styles,
        )

    def _get_elements_at_time(
        self, transcript: Transcript, styles: StyleConfig, timestamp: float
    ) -> List[Dict[str, Any]]:
        """Get all text elements active at a given timestamp."""
        elements = []

        for segment in transcript.segments:
            if segment.start <= timestamp <= segment.end:
                # Segment is active
                for word in segment.words:
                    if word.start <= timestamp <= word.end:
                        # Word is active
                        element = self._create_element(
                            word, segment, styles, timestamp, segment.start, word.start
                        )
                        elements.append(element)

        return elements

    def _create_element(
        self,
        word: Word,
        segment: Segment,
        styles: StyleConfig,
        current_time: float,
        segment_start: float,
        word_start: float,
    ) -> Dict[str, Any]:
        """Create a text element with animation properties."""
        # Calculate animation progress
        word_duration = word.end - word_start
        elapsed = current_time - word_start
        progress = min(1.0, max(0.0, elapsed / word_duration)) if word_duration > 0 else 1.0

        # Default properties
        element = {
            "text": word.text,
            "x": self.resolution[0] // 2,  # Center horizontally
            "y": self.resolution[1] // 2,  # Center vertically
            "opacity": 1.0,
            "scale": 1.0,
            "rotation": 0.0,
            "color": styles.color or "#FFFFFF",
            "fontSize": styles.font_size,
            "fontFamily": styles.font_family,
            "fontWeight": styles.font_weight,
        }

        # Apply animations
        for anim in styles.animations:
            if anim.selector == "word":
                # Calculate animation time
                anim_elapsed = current_time - word_start - anim.delay
                anim_progress = min(1.0, max(0.0, anim_elapsed / anim.duration)) if anim.duration > 0 else 1.0

                if anim_progress < 1.0:
                    # Interpolate keyframes
                    keyframes = anim.get_keyframes()
                    interpolator = KeyframeInterpolator(keyframes, anim.easing)
                    props = interpolator.interpolate(anim_progress)

                    # Apply properties
                    element.update(props)

        # Apply shadow if configured
        if styles.effects and styles.effects.shadow:
            element["shadow"] = styles.effects.shadow

        return element

    def render(
        self,
        timeline: Timeline,
        output_path: str,
        background: Optional[str] = None,
        progress: bool = True,
    ) -> Path:
        """Render timeline to video file."""
        logger.info(f"Starting render to {output_path}...")

        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)

        # Get styles from timeline or create minimal
        styles = timeline.styles or StyleConfig(
            resolution=timeline.resolution,
            fps=timeline.fps,
        )

        # Initialize renderer
        renderer = SkiaRenderer(timeline.resolution, styles)

        # Initialize GPU effects
        effects = []
        if styles.effects:
            if styles.effects.blur and styles.effects.blur.get("enabled"):
                effects.append(
                    GaussianBlur(
                        self.device,
                        radius=styles.effects.blur.get("radius", 5),
                    )
                )
            if styles.effects.glow and styles.effects.glow.get("enabled"):
                effects.append(
                    GlowEffect(
                        self.device,
                        intensity=styles.effects.glow.get("intensity", 0.3),
                        radius=styles.effects.glow.get("radius", 10),
                        color=styles.effects.glow.get("color"),
                    )
                )

        # Initialize video reader if background provided
        video_reader = None
        if background:
            video_reader = VideoReader(background)

        # Render frames
        try:
            logger.info("Starting FFmpeg encoder...")
            with FFmpegEncoder(
                str(output_file),
                timeline.resolution,
                timeline.fps,
            ) as encoder:
                logger.info(f"Encoding {len(timeline.frames)} frames at {timeline.fps} FPS")
                frame_iter = tqdm(timeline.frames, desc="Rendering", unit="frame") if progress else timeline.frames

                frames_written = 0
                for frame_idx, frame in enumerate(frame_iter):
                    try:
                        # Render text layer
                        frame_array = renderer.render_frame(
                            frame.elements,
                            background_color=styles.background_color,
                        )

                        # Composite with background video if available
                        if video_reader:
                            bg_frame = video_reader.get_frame(frame.timestamp)
                            if bg_frame is not None:
                                bg_frame = video_reader.resize_frame(bg_frame, timeline.resolution)
                                # Blend text over background
                                alpha = frame_array[:, :, 3:4] / 255.0
                                frame_array = (
                                    frame_array[:, :, :3] * alpha + bg_frame[:, :, :3] * (1 - alpha)
                                ).astype(np.uint8)
                                # Add alpha channel back
                                frame_array = np.concatenate(
                                    [frame_array, (alpha * 255).astype(np.uint8)], axis=2
                                )

                        # Apply GPU effects
                        if effects:
                            try:
                                frame_tensor = transfer_to_gpu(frame_array, self.device)
                                for effect in effects:
                                    frame_tensor = effect.apply(frame_tensor)
                                frame_array = transfer_to_cpu(frame_tensor).astype(np.uint8)
                            except Exception as e:
                                logger.warning(f"GPU effect failed on frame {frame_idx}: {e}, continuing without effects")

                        # Write frame
                        encoder.write_frame(frame_array)
                        frames_written += 1
                        
                        # Log progress every 1000 frames
                        if frame_idx > 0 and frame_idx % 1000 == 0:
                            logger.info(f"Rendered {frame_idx}/{len(timeline.frames)} frames ({frames_written} written)")
                            
                    except Exception as e:
                        logger.error(f"Error rendering frame {frame_idx}: {e}")
                        # Create a blank frame as fallback
                        frame_array = np.zeros((timeline.resolution[1], timeline.resolution[0], 4), dtype=np.uint8)
                        frame_array[:, :, :3] = styles.background_color[:3]
                        frame_array[:, :, 3] = styles.background_color[3]
                        encoder.write_frame(frame_array)
                        frames_written += 1
                        
                logger.info(f"Rendering complete: {frames_written} frames written")

        finally:
            if video_reader:
                video_reader.close()

        logger.info(f"Render complete: {output_file}")
        return output_file

    @staticmethod
    def load_transcript(file_path: str) -> Transcript:
        """Load transcript from file."""
        return parse_transcript(file_path)

    @staticmethod
    def load_styles(file_path: str) -> StyleConfig:
        """Load styles from file."""
        return parse_styles(file_path)

