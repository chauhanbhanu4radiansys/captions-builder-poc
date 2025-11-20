"""Validator for transcript and style schemas."""

from typing import Dict, Any
from loguru import logger
from engine.core.types import Transcript, StyleConfig
from engine.core.exceptions import ValidationError


def validate_transcript(transcript: Transcript) -> bool:
    """Validate transcript structure."""
    if not transcript.segments:
        raise ValidationError("Transcript must have at least one segment")

    # Filter out invalid segments and fix timing issues
    valid_segments = []
    
    for i, segment in enumerate(transcript.segments):
        if segment.start < 0:
            logger.warning(f"Segment {i} has negative start time, fixing to 0")
            segment.start = 0.0
            
        if not segment.words:
            logger.warning(f"Segment {i} has no words, skipping")
            continue
            
        # Fix invalid segment time ranges using word timings
        if segment.end <= segment.start:
            # Use word timings to fix segment
            segment.start = min(w.start for w in segment.words)
            segment.end = max(w.end for w in segment.words)
            if segment.end <= segment.start:
                # If still invalid, add minimal duration
                segment.end = segment.start + 0.1
                logger.warning(f"Segment {i} had invalid time range, fixed to [{segment.start}, {segment.end}]")

        # Fix word timing issues
        for j, word in enumerate(segment.words):
            # Fix invalid word time ranges
            if word.end < word.start:
                logger.warning(f"Word {j} in segment {i} has invalid time range, fixing")
                word.end = word.start + 0.01
            # Fix zero-duration words
            elif word.end == word.start:
                word.end = min(word.start + 0.01, segment.end)
            
            # Expand segment to include word if needed (more lenient)
            if word.start < segment.start:
                segment.start = word.start
            if word.end > segment.end:
                segment.end = word.end
                
        valid_segments.append(segment)
    
    # Replace segments with validated ones
    transcript.segments = valid_segments
    
    if not transcript.segments:
        raise ValidationError("No valid segments found in transcript")

    return True


def validate_styles(styles: StyleConfig) -> bool:
    """Validate style configuration."""
    if styles.fps <= 0:
        raise ValidationError("FPS must be positive")
    if styles.font_size <= 0:
        raise ValidationError("Font size must be positive")
    if len(styles.resolution) != 2 or any(r <= 0 for r in styles.resolution):
        raise ValidationError("Resolution must be a tuple of two positive integers")

    for anim in styles.animations:
        if anim.duration <= 0:
            raise ValidationError(f"Animation duration must be positive: {anim.selector}")
        if not anim.keyframes:
            raise ValidationError(f"Animation must have keyframes: {anim.selector}")

    return True

