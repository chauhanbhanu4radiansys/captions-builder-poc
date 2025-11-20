"""Gaussian blur effect using separable kernels."""

import torch
import torch.nn.functional as F
from typing import Optional
from engine.gpu.effects.base import BaseEffect


class GaussianBlur(BaseEffect):
    """Separable Gaussian blur effect."""

    def __init__(self, device: torch.device, radius: int = 5):
        """Initialize blur effect."""
        super().__init__(device)
        self.radius = max(0, min(50, radius))  # Clamp to 0-50
        self._kernel = self._create_kernel()

    def _create_kernel(self) -> torch.Tensor:
        """Create 1D Gaussian kernel."""
        if self.radius == 0:
            return torch.tensor([1.0], device=self.device)

        size = self.radius * 2 + 1
        kernel = torch.zeros(size, device=self.device)
        sigma = self.radius / 3.0

        for i in range(size):
            x = i - self.radius
            kernel[i] = torch.exp(-(x * x) / (2 * sigma * sigma))

        kernel = kernel / kernel.sum()
        return kernel

    def apply(self, frame: torch.Tensor) -> torch.Tensor:
        """Apply separable Gaussian blur."""
        if self.radius == 0:
            return frame

        # Ensure frame is (H, W, C) or (B, H, W, C)
        is_batch = len(frame.shape) == 4
        if not is_batch:
            frame = frame.unsqueeze(0)

        # Convert to (B, C, H, W) for conv2d
        frame = frame.permute(0, 3, 1, 2)

        # Expand kernel for conv2d
        kernel = self._kernel.view(1, 1, -1, 1)

        # Apply horizontal blur
        blurred = F.conv2d(
            frame,
            kernel,
            padding=(0, self.radius),
            groups=frame.shape[1],
        )

        # Apply vertical blur
        kernel = kernel.permute(0, 1, 3, 2)
        blurred = F.conv2d(
            blurred,
            kernel,
            padding=(self.radius, 0),
            groups=blurred.shape[1],
        )

        # Convert back to (B, H, W, C)
        blurred = blurred.permute(0, 2, 3, 1)

        if not is_batch:
            blurred = blurred.squeeze(0)

        return blurred

    def parameters(self) -> dict:
        """Get effect parameters."""
        params = super().parameters()
        params["radius"] = self.radius
        return params

