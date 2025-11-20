"""Basic rendering example."""

import sys
from pathlib import Path

# Add parent directory to path
SCRIPT_DIR = Path(__file__).parent
ROOT_DIR = SCRIPT_DIR.parent
sys.path.insert(0, str(ROOT_DIR))

from engine import MotionTypographyEngine

# Paths are already set above

def main():
    """Run basic render example."""
    print("Loading transcript and styles...")
    # Load files from root
    transcript = MotionTypographyEngine.load_transcript(str(ROOT_DIR / "trx.json"))
    styles = MotionTypographyEngine.load_styles(str(ROOT_DIR / "css.json"))
    video_path = ROOT_DIR / "v1.mp4"
    
    print(f"Transcript duration: {transcript.duration:.2f}s")
    print(f"Number of segments: {len(transcript.segments)}")

    # Initialize engine (use 30 FPS for better performance)
    print("Initializing engine...")
    engine = MotionTypographyEngine(
        resolution=(1920, 1080),
        fps=30,  # Reduced from 60 for better performance
        device="cuda:0"
    )

    # Compile animation
    print("Compiling timeline...")
    timeline = engine.compile(transcript, styles)
    print(f"Compiled {len(timeline.frames)} frames")

    # Render with progress bar
    print("Starting render (this may take a while for long videos)...")
    output = engine.render(
        timeline,
        output_path=str(ROOT_DIR / "output.mp4"),
        background=str(video_path) if video_path.exists() else None,
        progress=True
    )

    # Validate output
    if output.exists():
        size_mb = output.stat().st_size / (1024 * 1024)
        print(f"\n✅ Successfully rendered video: {output}")
        print(f"   Duration: {timeline.duration:.2f}s")
        print(f"   Frames: {len(timeline.frames)}")
        print(f"   Resolution: {timeline.resolution[0]}x{timeline.resolution[1]}")
        print(f"   FPS: {timeline.fps}")
        print(f"   Size: {size_mb:.2f} MB")
    else:
        print("❌ Output file was not created")
        raise FileNotFoundError("Output file was not created")

if __name__ == "__main__":
    main()

