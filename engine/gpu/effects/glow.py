"""Glow/Bloom effect using threshold and blur."""

import torch
from typing import Optional
from engine.gpu.effects.base import BaseEffect
from engine.gpu.effects.blur import GaussianBlur


class GlowEffect(BaseEffect):
    """Glow/Bloom effect using threshold-based extraction and blur."""

    def __init__(
        self,
        device: torch.device,
        intensity: float = 0.3,
        threshold: float = 0.8,
        radius: int = 10,
        color: Optional[tuple] = None,
    ):
        """Initialize glow effect."""
        super().__init__(device)
        self.intensity = max(0.0, min(1.0, intensity))
        self.threshold = max(0.0, min(1.0, threshold))
        self.radius = radius
        self.color = color or (255, 200, 100)
        self._blur = GaussianBlur(device, radius)

    def apply(self, frame: torch.Tensor) -> torch.Tensor:
        """Apply glow effect."""
        # Extract bright areas
        if len(frame.shape) == 3:
            # (H, W, C)
            gray = frame.mean(dim=2, keepdim=True) / 255.0
        else:
            # (B, H, W, C)
            gray = frame.mean(dim=3, keepdim=True) / 255.0

        # Threshold
        bright = (gray > self.threshold).float()

        # Apply blur to bright areas
        bright_tensor = bright.expand_as(frame) * frame
        blurred = self._blur.apply(bright_tensor)

        # Blend with original
        result = frame + blurred * self.intensity

        # Apply color tint if specified
        if self.color:
            color_tensor = torch.tensor(
                self.color, device=self.device, dtype=torch.float32
            ) / 255.0
            if len(result.shape) == 3:
                result = result * color_tensor.view(1, 1, -1)
            else:
                result = result * color_tensor.view(1, 1, 1, -1)

        # Clamp to valid range
        result = torch.clamp(result, 0, 255)

        return result

    def parameters(self) -> dict:
        """Get effect parameters."""
        params = super().parameters()
        params.update({
            "intensity": self.intensity,
            "threshold": self.threshold,
            "radius": self.radius,
            "color": self.color,
        })
        return params

