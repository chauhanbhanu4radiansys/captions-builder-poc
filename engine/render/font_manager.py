"""Font loading and caching manager."""

import skia
from pathlib import Path
from typing import Optional, Dict, Union
from functools import lru_cache
from engine.core.config import Config
from engine.core.exceptions import FontError


class FontManager:
    """Manages font loading and caching."""

    def __init__(self, cache_size: int = None):
        """Initialize font manager."""
        self.cache_size = cache_size or Config.FONT_CACHE_SIZE
        self._font_cache: Dict[str, skia.Font] = {}
        self._typeface_cache: Dict[str, skia.Typeface] = {}

    def get_font(
        self,
        family: str,
        size: float,
        weight: Optional[Union[int, str]] = None,
        italic: bool = False,
    ) -> skia.Font:
        """Get a font with caching."""
        cache_key = f"{family}:{size}:{weight}:{italic}"

        if cache_key not in self._font_cache:
            typeface = self.get_typeface(family, weight, italic)
            font = skia.Font(typeface, size)
            self._font_cache[cache_key] = font

            # Limit cache size
            if len(self._font_cache) > self.cache_size:
                # Remove oldest entry (simple FIFO)
                oldest_key = next(iter(self._font_cache))
                del self._font_cache[oldest_key]

        return self._font_cache[cache_key]

    def get_typeface(
        self,
        family: str,
        weight: Optional[Union[int, str]] = None,
        italic: bool = False,
    ) -> skia.Typeface:
        """Get a typeface with caching."""
        # Normalize weight
        weight_int = self._normalize_weight(weight)
        cache_key = f"{family}:{weight_int}:{italic}"

        if cache_key not in self._typeface_cache:
            typeface = self._load_typeface(family, weight_int, italic)
            if not typeface:
                # Fallback to default
                typeface = skia.Typeface.MakeDefault()
            self._typeface_cache[cache_key] = typeface

        return self._typeface_cache[cache_key]

    def _normalize_weight(self, weight: Optional[Union[int, str]]) -> int:
        """Normalize font weight to integer."""
        if weight is None:
            return 400  # Normal
        if isinstance(weight, int):
            return weight
        if isinstance(weight, str):
            weight_map = {
                "normal": 400,
                "bold": 700,
                "100": 100,
                "200": 200,
                "300": 300,
                "400": 400,
                "500": 500,
                "600": 600,
                "700": 700,
                "800": 800,
                "900": 900,
            }
            return weight_map.get(weight.lower(), 400)
        return 400

    def _load_typeface(
        self, family: str, weight: int, italic: bool
    ) -> Optional[skia.Typeface]:
        """Load a typeface from system or file."""
        # Try system fonts first
        # FontStyle requires: weight, width, slant
        width = skia.FontStyle.kNormal_Width
        slant = skia.FontStyle.Slant.kItalic_Slant if italic else skia.FontStyle.Slant.kUpright_Slant
        font_style = skia.FontStyle(weight, width, slant)
        typeface = skia.Typeface.MakeFromName(family, font_style)
        if typeface:
            return typeface

        # Try common font paths
        font_paths = [
            Path.home() / ".fonts" / f"{family}.ttf",
            Path("/usr/share/fonts") / f"{family}.ttf",
            Path("/System/Library/Fonts") / f"{family}.ttf",
        ]

        for path in font_paths:
            if path.exists():
                try:
                    return skia.Typeface.MakeFromFile(str(path))
                except Exception:
                    continue

        # Fallback to default
        return skia.Typeface.MakeDefault()

