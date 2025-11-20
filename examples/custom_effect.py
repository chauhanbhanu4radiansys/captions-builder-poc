"""Example of creating and using custom GPU effects."""

import sys
from pathlib import Path
import torch
import numpy as np

# Add parent directory to path
SCRIPT_DIR = Path(__file__).parent
ROOT_DIR = SCRIPT_DIR.parent
sys.path.insert(0, str(ROOT_DIR))

from engine import MotionTypographyEngine
from engine.core.types import StyleConfig, EffectConfig
from engine.gpu.effects.base import BaseEffect


class CustomWarpEffect(BaseEffect):
    """Custom warp effect example."""

    def __init__(self, device: torch.device, intensity: float = 0.1):
        """Initialize warp effect."""
        super().__init__(device)
        self.intensity = intensity

    def apply(self, frame: torch.Tensor) -> torch.Tensor:
        """Apply warp distortion."""
        # Simple sine wave warp
        h, w = frame.shape[:2]
        y_coords, x_coords = torch.meshgrid(
            torch.arange(h, device=self.device, dtype=torch.float32),
            torch.arange(w, device=self.device, dtype=torch.float32),
            indexing="ij",
        )

        # Apply sine wave distortion
        offset_x = torch.sin(y_coords * 0.1) * self.intensity * 10
        offset_y = torch.cos(x_coords * 0.1) * self.intensity * 10

        # Normalize coordinates
        x_norm = (x_coords + offset_x) / w * 2 - 1
        y_norm = (y_coords + offset_y) / h * 2 - 1

        # Sample with grid (simplified - would use grid_sample in production)
        # For this example, just return original
        return frame

    def parameters(self) -> dict:
        """Get effect parameters."""
        params = super().parameters()
        params["intensity"] = self.intensity
        return params


def main():
    """Run custom effect example."""
    transcript = MotionTypographyEngine.load_transcript(str(ROOT_DIR / "trx.json"))
    styles = MotionTypographyEngine.load_styles(str(ROOT_DIR / "css.json"))

    engine = MotionTypographyEngine(
        resolution=(1920, 1080),
        fps=60,
        device="cuda:0"
    )

    timeline = engine.compile(transcript, styles)

    # Note: Custom effects would need to be integrated into the pipeline
    # This example shows the structure for creating custom effects
    print("Custom effect example - effect class defined")
    print("To use custom effects, integrate them into the pipeline.render() method")

    output = engine.render(
        timeline,
        output_path=str(ROOT_DIR / "output_custom.mp4"),
        progress=True
    )

    print(f"✅ Custom effect example complete: {output}")

if __name__ == "__main__":
    main()

