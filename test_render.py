"""Quick test script to verify rendering works."""

import sys
from pathlib import Path

# Add parent directory to path
SCRIPT_DIR = Path(__file__).parent
sys.path.insert(0, str(SCRIPT_DIR))

from engine import MotionTypographyEngine
from engine.core.types import Transcript, Segment, Word, StyleConfig, Animation

def create_test_transcript():
    """Create a minimal test transcript."""
    words = [
        Word(text="Hello", start=0.0, end=0.5),
        Word(text="World", start=0.6, end=1.0),
    ]
    segment = Segment(
        text="Hello World",
        start=0.0,
        end=1.0,
        words=words
    )
    return Transcript(segments=[segment], duration=1.0)

def create_test_styles():
    """Create minimal test styles."""
    return StyleConfig(
        font_family="Arial",
        font_size=72,
        resolution=(1920, 1080),
        fps=30,  # Lower FPS for testing
        background_color=(0, 0, 0, 255),
        color="#FFFFFF",
    )

def main():
    """Run quick test render."""
    print("Creating test transcript and styles...")
    transcript = create_test_transcript()
    styles = create_test_styles()
    
    print("Initializing engine...")
    engine = MotionTypographyEngine(
        resolution=(1920, 1080),
        fps=30,
        device="cuda:0" if __import__("torch").cuda.is_available() else "cpu"
    )
    
    print("Compiling timeline...")
    timeline = engine.compile(transcript, styles)
    print(f"Compiled {len(timeline.frames)} frames")
    
    print("Rendering test video...")
    output = engine.render(
        timeline,
        output_path=str(SCRIPT_DIR / "test_output.mp4"),
        progress=True
    )
    
    if output.exists():
        size_mb = output.stat().st_size / (1024 * 1024)
        print(f"✅ Test render successful!")
        print(f"   Output: {output}")
        print(f"   Size: {size_mb:.2f} MB")
        print(f"   Frames: {len(timeline.frames)}")
    else:
        print("❌ Output file was not created")

if __name__ == "__main__":
    main()

