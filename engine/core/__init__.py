"""Core module for configuration, types, and exceptions."""

from engine.core.config import Config, get_config
from engine.core.types import (
    Transcript,
    Segment,
    Word,
    StyleConfig,
    Animation,
    Keyframe,
    EffectConfig,
    Timeline,
    Frame,
)
from engine.core.exceptions import (
    MotionTypographyError,
    DSLParseError,
    RenderError,
    GPUError,
    EncodingError,
)

__all__ = [
    "Config",
    "get_config",
    "Transcript",
    "Segment",
    "Word",
    "StyleConfig",
    "Animation",
    "Keyframe",
    "EffectConfig",
    "Timeline",
    "Frame",
    "MotionTypographyError",
    "DSLParseError",
    "RenderError",
    "GPUError",
    "EncodingError",
]

