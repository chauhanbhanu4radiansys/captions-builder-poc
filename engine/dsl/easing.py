"""Easing functions for smooth animations."""

import math
from typing import Callable


class EasingFunction:
    """Base class for easing functions."""

    @staticmethod
    def linear(t: float) -> float:
        """Linear interpolation."""
        return t

    # Quadratic
    @staticmethod
    def ease_in_quad(t: float) -> float:
        """Quadratic ease in."""
        return t * t

    @staticmethod
    def ease_out_quad(t: float) -> float:
        """Quadratic ease out."""
        return t * (2 - t)

    @staticmethod
    def ease_in_out_quad(t: float) -> float:
        """Quadratic ease in-out."""
        return 2 * t * t if t < 0.5 else -1 + (4 - 2 * t) * t

    # Cubic
    @staticmethod
    def ease_in_cubic(t: float) -> float:
        """Cubic ease in."""
        return t * t * t

    @staticmethod
    def ease_out_cubic(t: float) -> float:
        """Cubic ease out."""
        return (t - 1) * (t - 1) * (t - 1) + 1

    @staticmethod
    def ease_in_out_cubic(t: float) -> float:
        """Cubic ease in-out."""
        return 4 * t * t * t if t < 0.5 else (t - 1) * (2 * t - 2) * (2 * t - 2) + 1

    # Quartic
    @staticmethod
    def ease_in_quartic(t: float) -> float:
        """Quartic ease in."""
        return t * t * t * t

    @staticmethod
    def ease_out_quartic(t: float) -> float:
        """Quartic ease out."""
        return 1 - (t - 1) * (t - 1) * (t - 1) * (t - 1)

    @staticmethod
    def ease_in_out_quartic(t: float) -> float:
        """Quartic ease in-out."""
        return 8 * t * t * t * t if t < 0.5 else 1 - 8 * (t - 1) * (t - 1) * (t - 1) * (t - 1)

    # Sine
    @staticmethod
    def ease_in_sine(t: float) -> float:
        """Sine ease in."""
        return 1 - math.cos(t * math.pi / 2)

    @staticmethod
    def ease_out_sine(t: float) -> float:
        """Sine ease out."""
        return math.sin(t * math.pi / 2)

    @staticmethod
    def ease_in_out_sine(t: float) -> float:
        """Sine ease in-out."""
        return -(math.cos(math.pi * t) - 1) / 2

    # Exponential
    @staticmethod
    def ease_in_exponential(t: float) -> float:
        """Exponential ease in."""
        return 0 if t == 0 else math.pow(2, 10 * (t - 1))

    @staticmethod
    def ease_out_exponential(t: float) -> float:
        """Exponential ease out."""
        return 1 if t == 1 else 1 - math.pow(2, -10 * t)

    @staticmethod
    def ease_in_out_exponential(t: float) -> float:
        """Exponential ease in-out."""
        if t == 0:
            return 0
        if t == 1:
            return 1
        if t < 0.5:
            return math.pow(2, 20 * t - 10) / 2
        return (2 - math.pow(2, -20 * t + 10)) / 2

    # Elastic
    @staticmethod
    def ease_in_elastic(t: float) -> float:
        """Elastic ease in."""
        if t == 0:
            return 0
        if t == 1:
            return 1
        return -math.pow(2, 10 * (t - 1)) * math.sin((t - 1.1) * 5 * math.pi)

    @staticmethod
    def ease_out_elastic(t: float) -> float:
        """Elastic ease out."""
        if t == 0:
            return 0
        if t == 1:
            return 1
        return math.pow(2, -10 * t) * math.sin((t - 0.1) * 5 * math.pi) + 1

    @staticmethod
    def ease_in_out_elastic(t: float) -> float:
        """Elastic ease in-out."""
        if t == 0:
            return 0
        if t == 1:
            return 1
        if t < 0.5:
            return -(math.pow(2, 20 * t - 10) * math.sin((20 * t - 11.125) * (2 * math.pi) / 4.5)) / 2
        return (math.pow(2, -20 * t + 10) * math.sin((20 * t - 11.125) * (2 * math.pi) / 4.5)) / 2 + 1

    # Bounce
    @staticmethod
    def ease_in_bounce(t: float) -> float:
        """Bounce ease in."""
        return 1 - EasingFunction.ease_out_bounce(1 - t)

    @staticmethod
    def ease_out_bounce(t: float) -> float:
        """Bounce ease out."""
        if t < 1 / 2.75:
            return 7.5625 * t * t
        elif t < 2 / 2.75:
            t -= 1.5 / 2.75
            return 7.5625 * t * t + 0.75
        elif t < 2.5 / 2.75:
            t -= 2.25 / 2.75
            return 7.5625 * t * t + 0.9375
        else:
            t -= 2.625 / 2.75
            return 7.5625 * t * t + 0.984375

    @staticmethod
    def ease_in_out_bounce(t: float) -> float:
        """Bounce ease in-out."""
        if t < 0.5:
            return EasingFunction.ease_in_bounce(t * 2) / 2
        return EasingFunction.ease_out_bounce(t * 2 - 1) / 2 + 0.5

    # Back
    @staticmethod
    def ease_in_back(t: float) -> float:
        """Back ease in."""
        c1 = 1.70158
        c3 = c1 + 1
        return c3 * t * t * t - c1 * t * t

    @staticmethod
    def ease_out_back(t: float) -> float:
        """Back ease out."""
        c1 = 1.70158
        c3 = c1 + 1
        return 1 + c3 * math.pow(t - 1, 3) + c1 * math.pow(t - 1, 2)

    @staticmethod
    def ease_in_out_back(t: float) -> float:
        """Back ease in-out."""
        c1 = 1.70158
        c2 = c1 * 1.525
        if t < 0.5:
            return (t * t * ((c2 + 1) * 2 * t - c2)) / 2
        return ((t * 2 - 2) * (t * 2 - 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2


_EASING_MAP: dict[str, Callable[[float], float]] = {
    "linear": EasingFunction.linear,
    "easeInQuad": EasingFunction.ease_in_quad,
    "easeOutQuad": EasingFunction.ease_out_quad,
    "easeInOutQuad": EasingFunction.ease_in_out_quad,
    "easeInCubic": EasingFunction.ease_in_cubic,
    "easeOutCubic": EasingFunction.ease_out_cubic,
    "easeInOutCubic": EasingFunction.ease_in_out_cubic,
    "easeInQuartic": EasingFunction.ease_in_quartic,
    "easeOutQuartic": EasingFunction.ease_out_quartic,
    "easeInOutQuartic": EasingFunction.ease_in_out_quartic,
    "easeInSine": EasingFunction.ease_in_sine,
    "easeOutSine": EasingFunction.ease_out_sine,
    "easeInOutSine": EasingFunction.ease_in_out_sine,
    "easeInExponential": EasingFunction.ease_in_exponential,
    "easeOutExponential": EasingFunction.ease_out_exponential,
    "easeInOutExponential": EasingFunction.ease_in_out_exponential,
    "easeInElastic": EasingFunction.ease_in_elastic,
    "easeOutElastic": EasingFunction.ease_out_elastic,
    "easeInOutElastic": EasingFunction.ease_in_out_elastic,
    "easeInBounce": EasingFunction.ease_in_bounce,
    "easeOutBounce": EasingFunction.ease_out_bounce,
    "easeInOutBounce": EasingFunction.ease_in_out_bounce,
    "easeInBack": EasingFunction.ease_in_back,
    "easeOutBack": EasingFunction.ease_out_back,
    "easeInOutBack": EasingFunction.ease_in_out_back,
    # Aliases
    "easeIn": EasingFunction.ease_in_cubic,
    "easeOut": EasingFunction.ease_out_cubic,
    "easeInOut": EasingFunction.ease_in_out_cubic,
}


def get_easing_function(name: str) -> Callable[[float], float]:
    """Get easing function by name."""
    name_lower = name.lower()
    # Try exact match first
    if name in _EASING_MAP:
        return _EASING_MAP[name]
    # Try case-insensitive
    for key, func in _EASING_MAP.items():
        if key.lower() == name_lower:
            return func
    # Default to linear if not found
    return EasingFunction.linear

