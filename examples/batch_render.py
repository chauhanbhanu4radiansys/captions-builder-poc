"""Batch rendering example for multiple videos."""

import sys
from pathlib import Path

# Add parent directory to path
SCRIPT_DIR = Path(__file__).parent
ROOT_DIR = SCRIPT_DIR.parent
sys.path.insert(0, str(ROOT_DIR))

from engine import MotionTypographyEngine

def main():
    """Run batch render example."""
    # Load common style
    styles = MotionTypographyEngine.load_styles(str(ROOT_DIR / "css.json"))

    # List of transcript files (in this example, using the same file)
    transcript_files = [ROOT_DIR / "trx.json"]

    engine = MotionTypographyEngine(
        resolution=(1920, 1080),
        fps=60,
        device="cuda:0"
    )

    outputs = []
    for i, transcript_file in enumerate(transcript_files):
        print(f"\nProcessing {transcript_file.name} ({i+1}/{len(transcript_files)})...")

        transcript = MotionTypographyEngine.load_transcript(str(transcript_file))
        timeline = engine.compile(transcript, styles)

        output_path = ROOT_DIR / f"output_batch_{i+1}.mp4"
        output = engine.render(
            timeline,
            output_path=str(output_path),
            progress=True
        )

        outputs.append(output)
        print(f"✅ Completed: {output}")

    print(f"\n✅ Batch render complete: {len(outputs)} videos")

if __name__ == "__main__":
    main()

