"""Optimized basic rendering example with progress and optional frame limiting."""

import sys
from pathlib import Path

# Add parent directory to path
SCRIPT_DIR = Path(__file__).parent
ROOT_DIR = SCRIPT_DIR.parent
sys.path.insert(0, str(ROOT_DIR))

from engine import MotionTypographyEngine

def main():
    """Run basic render example with optimizations."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Render motion typography video")
    parser.add_argument("--max-duration", type=float, default=None, help="Maximum duration in seconds to render")
    parser.add_argument("--fps", type=int, default=30, help="Frames per second (default: 30)")
    parser.add_argument("--resolution", type=str, default="1920x1080", help="Resolution (default: 1920x1080)")
    args = parser.parse_args()
    
    # Parse resolution
    width, height = map(int, args.resolution.split('x'))
    
    # Load files from root
    print("Loading transcript and styles...")
    transcript = MotionTypographyEngine.load_transcript(str(ROOT_DIR / "trx.json"))
    styles = MotionTypographyEngine.load_styles(str(ROOT_DIR / "css.json"))
    video_path = ROOT_DIR / "v1.mp4"
    
    # Limit duration if specified
    if args.max_duration and transcript.duration > args.max_duration:
        print(f"Limiting render to first {args.max_duration}s (original: {transcript.duration:.2f}s)")
        # Filter segments
        transcript.segments = [s for s in transcript.segments if s.start < args.max_duration]
        transcript.duration = args.max_duration
        # Update last segment end time
        if transcript.segments:
            last_seg = transcript.segments[-1]
            if last_seg.end > args.max_duration:
                last_seg.end = args.max_duration
                # Filter words in last segment
                last_seg.words = [w for w in last_seg.words if w.start < args.max_duration]
                for w in last_seg.words:
                    if w.end > args.max_duration:
                        w.end = args.max_duration

    # Initialize engine
    print(f"Initializing engine (resolution: {width}x{height}, fps: {args.fps})...")
    engine = MotionTypographyEngine(
        resolution=(width, height),
        fps=args.fps,
        device="cuda:0"
    )

    # Compile animation
    print("Compiling timeline...")
    timeline = engine.compile(transcript, styles)
    print(f"Compiled {len(timeline.frames)} frames ({timeline.duration:.2f}s)")

    # Render with progress bar
    print("Starting render...")
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

if __name__ == "__main__":
    main()

