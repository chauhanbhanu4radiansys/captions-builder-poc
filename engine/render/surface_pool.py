"""Surface memory pooling for efficient rendering."""

import skia
from typing import Optional, Tuple
from collections import deque
from engine.core.config import Config


class SurfacePool:
    """Pool of reusable Skia surfaces for memory efficiency."""

    def __init__(self, pool_size: int = None):
        """Initialize surface pool."""
        self.pool_size = pool_size or Config.SURFACE_POOL_SIZE
        self._pool: deque = deque(maxlen=self.pool_size)
        self._width: Optional[int] = None
        self._height: Optional[int] = None

    def get_surface(self, width: int, height: int) -> skia.Surface:
        """Get a surface from the pool or create a new one."""
        # If dimensions changed, clear pool
        if self._width != width or self._height != height:
            self._pool.clear()
            self._width = width
            self._height = height

        if self._pool:
            surface = self._pool.popleft()
            # Clear the surface
            surface.getCanvas().clear(skia.ColorTRANSPARENT)
            return surface

        # Create new surface
        return skia.Surface(width, height)

    def return_surface(self, surface: skia.Surface):
        """Return a surface to the pool."""
        if len(self._pool) < self.pool_size:
            self._pool.append(surface)

    def clear(self):
        """Clear the pool."""
        self._pool.clear()

