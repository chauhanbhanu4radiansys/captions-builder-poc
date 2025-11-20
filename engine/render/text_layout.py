"""Text layout and positioning utilities."""

from typing import List, Tuple, Optional
import skia
from engine.core.types import Word, Segment, StyleConfig


class TextLayout:
    """Handles text layout, wrapping, and positioning."""

    @staticmethod
    def layout_words(
        words: List[Word],
        font: skia.Font,
        max_width: float,
        letter_spacing: Optional[float] = None,
        word_spacing: Optional[float] = None,
    ) -> List[Tuple[str, skia.Rect]]:
        """Layout words into lines with wrapping."""
        lines = []
        current_line = []
        current_width = 0.0

        for word in words:
            word_width = font.measureText(word.text)
            if letter_spacing:
                word_width += letter_spacing * (len(word.text) - 1)
            if word_spacing and current_line:
                word_width += word_spacing

            if current_line and current_width + word_width > max_width:
                # Start new line
                lines.append((current_line, current_width))
                current_line = [word]
                current_width = word_width
            else:
                current_line.append(word)
                current_width += word_width

        if current_line:
            lines.append((current_line, current_width))

        # Convert to rectangles
        result = []
        y_offset = 0.0
        line_height = font.getMetrics().fHeight * 1.2  # Add some spacing

        for line_words, line_width in lines:
            x_offset = 0.0
            for word in line_words:
                word_width = font.measureText(word.text)
                if letter_spacing:
                    word_width += letter_spacing * (len(word.text) - 1)

                rect = skia.Rect.MakeXYWH(
                    x_offset, y_offset, word_width, line_height
                )
                result.append((word.text, rect))
                x_offset += word_width
                if word_spacing:
                    x_offset += word_spacing

            y_offset += line_height

        return result

    @staticmethod
    def center_text(
        text: str, font: skia.Font, bounds: skia.Rect
    ) -> Tuple[float, float]:
        """Calculate centered text position."""
        text_width = font.measureText(text)
        metrics = font.getMetrics()
        text_height = metrics.fHeight

        x = bounds.centerX() - text_width / 2
        y = bounds.centerY() - text_height / 2 - metrics.fAscent

        return (x, y)

    @staticmethod
    def align_text(
        text: str,
        font: skia.Font,
        bounds: skia.Rect,
        align: str = "center",
    ) -> Tuple[float, float]:
        """Calculate text position based on alignment."""
        text_width = font.measureText(text)
        metrics = font.getMetrics()
        text_height = metrics.fHeight

        if align == "left":
            x = bounds.left()
        elif align == "right":
            x = bounds.right() - text_width
        else:  # center
            x = bounds.centerX() - text_width / 2

        y = bounds.centerY() - text_height / 2 - metrics.fAscent

        return (x, y)

