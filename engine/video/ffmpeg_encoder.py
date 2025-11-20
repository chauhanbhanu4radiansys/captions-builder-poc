"""FFmpeg NVENC encoder for video output."""

import subprocess
import numpy as np
from pathlib import Path
from typing import Tuple, Optional
from loguru import logger
from engine.core.config import Config
from engine.core.exceptions import EncodingError


class FFmpegEncoder:
    """FFmpeg-based video encoder with NVENC support."""

    def __init__(
        self,
        output_path: str,
        resolution: Tuple[int, int],
        fps: int,
        codec: str = None,
        preset: str = None,
        bitrate: str = None,
    ):
        """Initialize encoder."""
        self.output_path = Path(output_path)
        self.width, self.height = resolution
        self.fps = fps
        self.codec = codec or Config.NVENC_CODEC
        self.preset = preset or Config.NVENC_PRESET
        self.bitrate = bitrate or Config.OUTPUT_BITRATE

        self._process: Optional[subprocess.Popen] = None
        self._frame_count = 0

    def start(self):
        """Start encoding process."""
        # Build FFmpeg command
        cmd = [
            Config.FFMPEG_PATH,
            "-y",  # Overwrite output
            "-f", "rawvideo",
            "-vcodec", "rawvideo",
            "-s", f"{self.width}x{self.height}",
            "-pix_fmt", "rgba",
            "-r", str(self.fps),
            "-i", "-",  # Read from stdin
            "-c:v", self.codec,
            "-preset", self.preset,
            "-b:v", self.bitrate,
            "-pix_fmt", "yuv420p",
            "-r", str(self.fps),
            str(self.output_path),
        ]

        try:
            logger.info(f"Starting FFmpeg with command: {' '.join(cmd[:5])}...")
            self._process = subprocess.Popen(
                cmd,
                stdin=subprocess.PIPE,
                stderr=subprocess.PIPE,
                stdout=subprocess.PIPE,
            )
            # Check if process started successfully
            if self._process.poll() is not None:
                stderr = self._process.stderr.read().decode() if self._process.stderr else "Unknown error"
                raise EncodingError(f"FFmpeg process exited immediately: {stderr}")
            logger.info("FFmpeg encoder started successfully")
        except Exception as e:
            raise EncodingError(f"Failed to start FFmpeg: {e}")

    def write_frame(self, frame: np.ndarray):
        """Write a frame to the encoder."""
        if not self._process:
            raise EncodingError("Encoder not started")

        # Ensure frame is correct shape and type
        if frame.shape[:2] != (self.height, self.width):
            raise EncodingError(
                f"Frame size mismatch: expected {(self.height, self.width)}, got {frame.shape[:2]}"
            )

        # Ensure RGBA format
        if len(frame.shape) == 3 and frame.shape[2] == 4:
            frame_bytes = frame.astype(np.uint8).tobytes()
        else:
            raise EncodingError(f"Invalid frame format: {frame.shape}")

        try:
            self._process.stdin.write(frame_bytes)
            self._process.stdin.flush()
            self._frame_count += 1
        except Exception as e:
            raise EncodingError(f"Failed to write frame: {e}")

    def finish(self):
        """Finish encoding and close process."""
        if self._process:
            try:
                self._process.stdin.close()
                self._process.wait(timeout=30)
            except subprocess.TimeoutExpired:
                self._process.kill()
                raise EncodingError("FFmpeg encoding timed out")
            except Exception as e:
                raise EncodingError(f"Error finishing encoding: {e}")

        if not self.output_path.exists():
            raise EncodingError(f"Output file was not created: {self.output_path}")

    def __enter__(self):
        """Context manager entry."""
        self.start()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.finish()

