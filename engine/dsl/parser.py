"""Parser for transcript and style files."""

import json
from pathlib import Path
from typing import Dict, Any, Union
from engine.core.types import Transcript, StyleConfig
from engine.core.exceptions import DSLParseError


def parse_transcript(file_path: Union[str, Path]) -> Transcript:
    """Parse transcript JSON file."""
    try:
        path = Path(file_path)
        if not path.exists():
            raise DSLParseError(f"Transcript file not found: {file_path}")

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        return Transcript.from_dict(data)
    except json.JSONDecodeError as e:
        raise DSLParseError(f"Invalid JSON in transcript file: {e}")
    except Exception as e:
        raise DSLParseError(f"Error parsing transcript: {e}")


def parse_styles(file_path: Union[str, Path]) -> StyleConfig:
    """Parse styles JSON file."""
    try:
        path = Path(file_path)
        if not path.exists():
            raise DSLParseError(f"Styles file not found: {file_path}")

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        return StyleConfig.from_dict(data)
    except json.JSONDecodeError as e:
        raise DSLParseError(f"Invalid JSON in styles file: {e}")
    except Exception as e:
        raise DSLParseError(f"Error parsing styles: {e}")

