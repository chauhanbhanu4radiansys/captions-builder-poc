"""Keyframe interpolation engine."""

from typing import Dict, Any, List, Optional
from engine.core.types import Keyframe
from engine.dsl.easing import get_easing_function


class KeyframeInterpolator:
    """Interpolates between keyframes with easing."""

    def __init__(self, keyframes: List[Keyframe], easing: str = "linear"):
        """Initialize interpolator with keyframes and easing function."""
        self.keyframes = sorted(keyframes, key=lambda k: k.time)
        self.easing_func = get_easing_function(easing)
        self._validate_keyframes()

    def _validate_keyframes(self):
        """Validate keyframe structure."""
        if not self.keyframes:
            raise ValueError("At least one keyframe is required")
        if self.keyframes[0].time != 0.0:
            raise ValueError("First keyframe must be at time 0.0")
        if self.keyframes[-1].time != 1.0:
            raise ValueError("Last keyframe must be at time 1.0")

    def interpolate(self, t: float) -> Dict[str, Any]:
        """Interpolate properties at normalized time t (0.0 to 1.0)."""
        t = max(0.0, min(1.0, t))  # Clamp to [0, 1]
        
        # Apply easing
        eased_t = self.easing_func(t)

        # Find surrounding keyframes
        for i in range(len(self.keyframes) - 1):
            kf1 = self.keyframes[i]
            kf2 = self.keyframes[i + 1]

            if kf1.time <= eased_t <= kf2.time:
                # Interpolate between kf1 and kf2
                local_t = (eased_t - kf1.time) / (kf2.time - kf1.time) if kf2.time != kf1.time else 0.0
                return self._interpolate_properties(kf1.properties, kf2.properties, local_t)

        # Should never reach here, but return last keyframe
        return self.keyframes[-1].properties.copy()

    def _interpolate_properties(
        self, props1: Dict[str, Any], props2: Dict[str, Any], t: float
    ) -> Dict[str, Any]:
        """Interpolate between two property dictionaries."""
        result = {}
        all_keys = set(props1.keys()) | set(props2.keys())

        for key in all_keys:
            val1 = props1.get(key)
            val2 = props2.get(key)

            if val1 is None:
                result[key] = val2
            elif val2 is None:
                result[key] = val1
            else:
                result[key] = self._interpolate_value(val1, val2, t)

        return result

    def _interpolate_value(self, val1: Any, val2: Any, t: float) -> Any:
        """Interpolate a single value."""
        # Numbers
        if isinstance(val1, (int, float)) and isinstance(val2, (int, float)):
            return val1 + (val2 - val1) * t

        # Lists/Tuples (for colors, positions, etc.)
        if isinstance(val1, (list, tuple)) and isinstance(val2, (list, tuple)):
            if len(val1) == len(val2):
                return type(val1)(self._interpolate_value(v1, v2, t) for v1, v2 in zip(val1, val2))

        # Strings (no interpolation, use val2)
        if isinstance(val1, str) or isinstance(val2, str):
            return val2 if t > 0.5 else val1

        # Default: use val2
        return val2

