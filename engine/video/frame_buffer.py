"""Circular frame buffer for efficient encoding."""

import numpy as np
from collections import deque
from typing import Optional
from engine.core.config import Config


class FrameBuffer:
    """Circular buffer for frame storage."""

    def __init__(self, size: int = None):
        """Initialize frame buffer."""
        self.size = size or Config.FRAME_BUFFER_SIZE
        self._buffer: deque = deque(maxlen=self.size)
        self._total_frames = 0

    def push(self, frame: np.ndarray):
        """Push a frame to the buffer."""
        self._buffer.append(frame.copy())
        self._total_frames += 1

    def pop(self) -> Optional[np.ndarray]:
        """Pop a frame from the buffer."""
        if self._buffer:
            return self._buffer.popleft()
        return None

    def peek(self) -> Optional[np.ndarray]:
        """Peek at the next frame without removing it."""
        if self._buffer:
            return self._buffer[0]
        return None

    def is_empty(self) -> bool:
        """Check if buffer is empty."""
        return len(self._buffer) == 0

    def is_full(self) -> bool:
        """Check if buffer is full."""
        return len(self._buffer) >= self.size

    def clear(self):
        """Clear the buffer."""
        self._buffer.clear()

    def __len__(self) -> int:
        """Get current buffer size."""
        return len(self._buffer)

