"""Skia-based text renderer."""

import skia
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
from engine.core.types import StyleConfig, Word, Segment
from engine.render.font_manager import FontManager
from engine.render.text_layout import TextLayout
from engine.render.surface_pool import SurfacePool
from engine.core.exceptions import RenderError


class SkiaRenderer:
    """Renders text using Skia with hardware acceleration."""

    def __init__(self, resolution: Tuple[int, int], style: StyleConfig):
        """Initialize renderer."""
        self.width, self.height = resolution
        self.style = style
        self.font_manager = FontManager()
        self.surface_pool = SurfacePool()
        self._current_surface: Optional[skia.Surface] = None

    def render_frame(
        self, elements: List[Dict[str, Any]], background_color: Optional[Tuple[int, int, int, int]] = None
    ) -> np.ndarray:
        """Render a single frame with text elements."""
        # Get or create surface
        surface = self.surface_pool.get_surface(self.width, self.height)
        canvas = surface.getCanvas()

        # Clear with background color
        bg_color = background_color or self.style.background_color
        canvas.clear(skia.Color4f(*[c / 255.0 for c in bg_color]))

        # Render each element (skip empty text)
        for element in elements:
            text = element.get("text", "").strip()
            if text:  # Only render non-empty text
                try:
                    self._render_element(canvas, element)
                except Exception as e:
                    # Log but continue rendering
                    import warnings
                    warnings.warn(f"Failed to render element: {e}")

        # Convert to numpy array
        image = surface.makeImageSnapshot()
        pixels = image.tobytes()
        arr = np.frombuffer(pixels, dtype=np.uint8).reshape(
            self.height, self.width, 4
        )

        # Return surface to pool
        self.surface_pool.return_surface(surface)

        return arr

    def _render_element(self, canvas: skia.Canvas, element: Dict[str, Any]):
        """Render a single text element."""
        text = element.get("text", "")
        x = element.get("x", 0)
        y = element.get("y", 0)
        opacity = element.get("opacity", 1.0)
        scale = element.get("scale", 1.0)
        rotation = element.get("rotation", 0.0)
        color = element.get("color", self.style.color or "#FFFFFF")
        font_size = element.get("fontSize", self.style.font_size)
        font_family = element.get("fontFamily", self.style.font_family)
        font_weight = element.get("fontWeight", self.style.font_weight)

        # Get font
        font = self.font_manager.get_font(
            font_family, font_size, font_weight, False
        )

        # Parse color
        paint = skia.Paint()
        rgba = self._parse_color(color)
        paint.setColor4f(skia.Color4f(*[c / 255.0 for c in rgba]))
        paint.setAlphaf(opacity)

        # Apply transforms
        canvas.save()
        try:
            canvas.translate(x, y)
            canvas.scale(scale, scale)
            canvas.rotate(rotation)

            # Render text (only if text is not empty)
            if text.strip():
                canvas.drawString(text, 0, 0, font, paint)

            # Apply effects
            if element.get("shadow"):
                self._render_shadow(canvas, text, font, element["shadow"])
        finally:
            canvas.restore()

    def _parse_color(self, color: str) -> Tuple[int, int, int, int]:
        """Parse color string to RGBA tuple."""
        if color.startswith("#"):
            # Hex color
            hex_color = color.lstrip("#")
            if len(hex_color) == 6:
                r = int(hex_color[0:2], 16)
                g = int(hex_color[2:4], 16)
                b = int(hex_color[4:6], 16)
                return (r, g, b, 255)
            elif len(hex_color) == 8:
                r = int(hex_color[0:2], 16)
                g = int(hex_color[2:4], 16)
                b = int(hex_color[4:6], 16)
                a = int(hex_color[6:8], 16)
                return (r, g, b, a)
        elif color.startswith("rgba"):
            # rgba(r, g, b, a)
            import re
            match = re.match(r"rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)", color)
            if match:
                r, g, b, a = map(float, match.groups())
                return (int(r), int(g), int(b), int(a * 255))
        elif color.startswith("rgb"):
            # rgb(r, g, b)
            import re
            match = re.match(r"rgb\((\d+),\s*(\d+),\s*(\d+)\)", color)
            if match:
                r, g, b = map(int, match.groups())
                return (r, g, b, 255)

        # Default to white
        return (255, 255, 255, 255)

    def _render_shadow(
        self, canvas: skia.Canvas, text: str, font: skia.Font, shadow_config: Dict[str, Any]
    ):
        """Render text shadow."""
        shadow_paint = skia.Paint()
        shadow_paint.setColor4f(skia.Color4f(0, 0, 0, 0.5))
        shadow_paint.setMaskFilter(
            skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, shadow_config.get("blur", 4))
        )

        offset_x = shadow_config.get("offsetX", 2)
        offset_y = shadow_config.get("offsetY", 2)

        canvas.save()
        canvas.translate(offset_x, offset_y)
        canvas.drawString(text, 0, 0, font, shadow_paint)
        canvas.restore()

