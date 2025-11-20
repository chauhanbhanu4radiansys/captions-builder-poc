"""Video reader for background video composition."""

import cv2
import numpy as np
from pathlib import Path
from typing import Optional, Tuple
from engine.core.exceptions import EncodingError


class VideoReader:
    """Reads video frames for background composition."""

    def __init__(self, video_path: str):
        """Initialize video reader."""
        self.video_path = Path(video_path)
        if not self.video_path.exists():
            raise EncodingError(f"Video file not found: {video_path}")

        self.cap = cv2.VideoCapture(str(self.video_path))
        if not self.cap.isOpened():
            raise EncodingError(f"Could not open video: {video_path}")

        self.fps = self.cap.get(cv2.CAP_PROP_FPS)
        self.width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        self.frame_count = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
        self.duration = self.frame_count / self.fps if self.fps > 0 else 0

    def get_frame(self, timestamp: float) -> Optional[np.ndarray]:
        """Get frame at specific timestamp."""
        frame_number = int(timestamp * self.fps)
        self.cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)

        ret, frame = self.cap.read()
        if not ret:
            return None

        # Convert BGR to RGBA
        frame_rgba = cv2.cvtColor(frame, cv2.COLOR_BGR2RGBA)
        return frame_rgba

    def resize_frame(self, frame: np.ndarray, target_size: Tuple[int, int]) -> np.ndarray:
        """Resize frame to target size."""
        target_width, target_height = target_size
        return cv2.resize(frame, (target_width, target_height), interpolation=cv2.INTER_LINEAR)

    def close(self):
        """Close video reader."""
        if self.cap:
            self.cap.release()

    def __enter__(self):
        """Context manager entry."""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.close()

