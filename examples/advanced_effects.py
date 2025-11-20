"""Advanced effects example with custom animations."""

import sys
from pathlib import Path

# Add parent directory to path
SCRIPT_DIR = Path(__file__).parent
ROOT_DIR = SCRIPT_DIR.parent
sys.path.insert(0, str(ROOT_DIR))

from engine import MotionTypographyEngine
from engine.core.types import StyleConfig, Animation, EffectConfig

def main():
    """Run advanced effects example."""
    # Load transcript
    transcript = MotionTypographyEngine.load_transcript(str(ROOT_DIR / "trx.json"))

    # Create custom style with advanced effects
    custom_style = StyleConfig(
        font_family="Arial",
        font_size=96,
        resolution=(1920, 1080),
        fps=60,
        background_color=(20, 20, 30, 255),
        color="#FFD700",
        animations=[
            Animation(
                selector="word",
                keyframes={
                    "0%": {"opacity": 0, "scale": 0.5, "y": 100, "rotation": -45},
                    "50%": {"opacity": 1, "scale": 1.2, "y": -20, "rotation": 5},
                    "100%": {"opacity": 1, "scale": 1.0, "y": 0, "rotation": 0},
                },
                duration=0.8,
                easing="easeOutBounce",
            ),
        ],
        effects=EffectConfig(
            blur={"enabled": False},
            glow={
                "enabled": True,
                "intensity": 0.5,
                "radius": 15,
                "color": [255, 215, 0],
            },
            shadow={
                "offsetX": 4,
                "offsetY": 4,
                "blur": 8,
                "color": [0, 0, 0, 180],
            },
        ),
    )

    # Initialize engine
    engine = MotionTypographyEngine(
        resolution=(1920, 1080),
        fps=60,
        device="cuda:0"
    )

    # Compile and render
    timeline = engine.compile(transcript, custom_style)
    output = engine.render(
        timeline,
        output_path=str(ROOT_DIR / "output_advanced.mp4"),
        progress=True
    )

    print(f"✅ Advanced effects render complete: {output}")

if __name__ == "__main__":
    main()

