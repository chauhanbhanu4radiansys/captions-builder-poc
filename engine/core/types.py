"""Type definitions and dataclasses for the motion typography engine."""

from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple, Any, Union
from pathlib import Path


@dataclass
class Word:
    """Represents a single word with timing information."""

    text: str
    start: float
    end: float
    id: Optional[int] = None

    @property
    def duration(self) -> float:
        """Get word duration in seconds."""
        return self.end - self.start


@dataclass
class Segment:
    """Represents a transcript segment with words."""

    text: str
    start: float
    end: float
    words: List[Word]
    id: Optional[int] = None
    speaker_id: Optional[str] = None

    @property
    def duration(self) -> float:
        """Get segment duration in seconds."""
        return self.end - self.start


@dataclass
class Transcript:
    """Complete transcript with segments and metadata."""

    segments: List[Segment]
    duration: float
    language: Optional[str] = None
    text: Optional[str] = None

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Transcript":
        """Create Transcript from dictionary (supports both formats)."""
        # Support nested format (transcription_data.segments)
        if "transcription_data" in data:
            trans_data = data["transcription_data"]
            segments_data = trans_data.get("segments", [])
            duration = trans_data.get("duration", 0.0)
            language = trans_data.get("language")
            text = trans_data.get("text")
        else:
            segments_data = data.get("segments", [])
            duration = data.get("duration", 0.0)
            language = data.get("language")
            text = data.get("text")

        segments = []
        for seg_data in segments_data:
            words = []
            for word_data in seg_data.get("words", []):
                word = Word(
                    text=word_data.get("text", word_data.get("word", "")),
                    start=word_data.get("start", 0.0),
                    end=word_data.get("end", 0.0),
                    id=word_data.get("id"),
                )
                words.append(word)

            segment = Segment(
                text=seg_data.get("text", ""),
                start=seg_data.get("start", 0.0),
                end=seg_data.get("end", 0.0),
                words=words,
                id=seg_data.get("id"),
                speaker_id=seg_data.get("speaker_id"),
            )
            segments.append(segment)

        return cls(
            segments=segments,
            duration=duration,
            language=language,
            text=text,
        )


@dataclass
class Keyframe:
    """Represents a keyframe in an animation."""

    time: float  # 0.0 to 1.0
    properties: Dict[str, Any]

    def __post_init__(self):
        """Validate keyframe time."""
        if not 0.0 <= self.time <= 1.0:
            raise ValueError(f"Keyframe time must be between 0.0 and 1.0, got {self.time}")


@dataclass
class Animation:
    """Represents an animation configuration."""

    selector: str  # word, line, segment, character
    keyframes: Dict[str, Dict[str, Any]]  # "0%": {...}, "100%": {...}
    duration: float  # in seconds
    easing: str = "linear"
    delay: float = 0.0
    stagger: Optional[float] = None  # delay between elements

    def get_keyframes(self) -> List[Keyframe]:
        """Convert percentage keyframes to normalized keyframes."""
        result = []
        for time_str, props in self.keyframes.items():
            # Convert "50%" to 0.5
            time = float(time_str.rstrip("%")) / 100.0
            result.append(Keyframe(time=time, properties=props))
        return sorted(result, key=lambda k: k.time)


@dataclass
class EffectConfig:
    """Configuration for visual effects."""

    blur: Optional[Dict[str, Any]] = None
    glow: Optional[Dict[str, Any]] = None
    shadow: Optional[Dict[str, Any]] = None
    color_grade: Optional[Dict[str, Any]] = None


@dataclass
class StyleConfig:
    """Global style configuration."""

    font_family: str = "Arial"
    font_size: int = 72
    resolution: Tuple[int, int] = (1920, 1080)
    fps: int = 60
    background_color: Tuple[int, int, int, int] = (0, 0, 0, 255)
    animations: List[Animation] = field(default_factory=list)
    effects: Optional[EffectConfig] = None
    # Additional style properties
    color: Optional[str] = None
    letter_spacing: Optional[float] = None
    line_height: Optional[float] = None
    font_weight: Optional[Union[int, str]] = None
    text_align: Optional[str] = None
    padding: Optional[Tuple[float, float]] = None
    border_radius: Optional[float] = None
    background_color_rgba: Optional[str] = None

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "StyleConfig":
        """Create StyleConfig from dictionary."""
        global_styles = data.get("globalStyles", data.get("data", {}))
        
        # Handle resolution
        resolution = global_styles.get("resolution", [1920, 1080])
        if isinstance(resolution, list):
            resolution = tuple(resolution)

        # Handle background color
        bg_color = global_styles.get("backgroundColor", [0, 0, 0, 255])
        if isinstance(bg_color, list):
            bg_color = tuple(bg_color) if len(bg_color) == 4 else tuple(bg_color) + (255,)

        # Parse animations
        animations = []
        for anim_data in data.get("animations", []):
            anim = Animation(
                selector=anim_data.get("selector", "word"),
                keyframes=anim_data.get("keyframes", {}),
                duration=anim_data.get("duration", 0.5),
                easing=anim_data.get("easing", "linear"),
                delay=anim_data.get("delay", 0.0),
                stagger=anim_data.get("stagger"),
            )
            animations.append(anim)

        # Parse effects
        effects_data = data.get("effects", {})
        effects = None
        if effects_data:
            effects = EffectConfig(
                blur=effects_data.get("blur"),
                glow=effects_data.get("glow"),
                shadow=effects_data.get("shadow"),
                color_grade=effects_data.get("colorGrade"),
            )

        # Handle cueStyles for template format
        cue_styles = global_styles.get("cueStyles", {})
        
        return cls(
            font_family=cue_styles.get("fontFamily", global_styles.get("fontFamily", "Arial")),
            font_size=global_styles.get("fontSize", 72),
            resolution=resolution,
            fps=global_styles.get("fps", 60),
            background_color=bg_color,
            animations=animations,
            effects=effects,
            color=cue_styles.get("color", global_styles.get("color")),
            letter_spacing=cue_styles.get("letterSpacing", global_styles.get("letterSpacing")),
            line_height=cue_styles.get("lineHeight", global_styles.get("lineHeight")),
            font_weight=cue_styles.get("fontWeight", global_styles.get("fontWeight")),
            text_align=cue_styles.get("textAlign", global_styles.get("textAlign")),
            padding=_parse_padding(cue_styles.get("padding")),
            border_radius=cue_styles.get("borderRadius", global_styles.get("borderRadius")),
            background_color_rgba=cue_styles.get("backgroundColor"),
        )


def _parse_padding(padding: Optional[Union[str, float, List[float]]]) -> Optional[Tuple[float, float]]:
    """Parse padding value to tuple."""
    if padding is None:
        return None
    if isinstance(padding, (int, float)):
        return (float(padding), float(padding))
    if isinstance(padding, str):
        # Parse "0.4em 0.8em" format
        parts = padding.split()
        if len(parts) == 2:
            try:
                return (float(parts[0].rstrip("em")), float(parts[1].rstrip("em")))
            except ValueError:
                pass
    if isinstance(padding, list) and len(padding) >= 2:
        return (float(padding[0]), float(padding[1]))
    return None


@dataclass
class Frame:
    """Represents a single frame with text elements."""

    timestamp: float
    elements: List[Dict[str, Any]]  # Text elements to render


@dataclass
class Timeline:
    """Compiled timeline with frames."""

    frames: List[Frame]
    duration: float
    fps: int
    resolution: Tuple[int, int]
    styles: Optional[Any] = None  # Store StyleConfig for rendering

