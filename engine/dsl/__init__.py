"""DSL module for parsing and validating animation definitions."""

from engine.dsl.parser import parse_transcript, parse_styles
from engine.dsl.validator import validate_transcript, validate_styles
from engine.dsl.keyframes import KeyframeInterpolator
from engine.dsl.easing import EasingFunction, get_easing_function

__all__ = [
    "parse_transcript",
    "parse_styles",
    "validate_transcript",
    "validate_styles",
    "KeyframeInterpolator",
    "EasingFunction",
    "get_easing_function",
]

