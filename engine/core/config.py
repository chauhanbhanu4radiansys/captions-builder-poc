"""Configuration management with environment variable support."""

import os
from pathlib import Path
from typing import Optional, Tuple
from dotenv import load_dotenv

# Load .env file if it exists
load_dotenv()


class Config:
    """Configuration manager for the motion typography engine."""

    # CUDA settings
    CUDA_VISIBLE_DEVICES: str = os.getenv("CUDA_VISIBLE_DEVICES", "0")
    DEFAULT_DEVICE: str = f"cuda:{CUDA_VISIBLE_DEVICES.split(',')[0]}" if CUDA_VISIBLE_DEVICES else "cuda:0"

    # FFmpeg settings
    FFMPEG_PATH: str = os.getenv("FFMPEG_PATH", "ffmpeg")
    NVENC_PRESET: str = os.getenv("NVENC_PRESET", "p4")
    OUTPUT_BITRATE: str = os.getenv("OUTPUT_BITRATE", "10M")
    NVENC_CODEC: str = os.getenv("NVENC_CODEC", "h264_nvenc")

    # Cache settings
    CACHE_DIR: Path = Path(os.getenv("CACHE_DIR", "/tmp/motion-typo-cache"))
    FONT_CACHE_SIZE: int = int(os.getenv("FONT_CACHE_SIZE", "100"))

    # Performance settings
    MAX_GPU_MEMORY_GB: float = float(os.getenv("MAX_GPU_MEMORY_GB", "4.0"))
    FRAME_BUFFER_SIZE: int = int(os.getenv("FRAME_BUFFER_SIZE", "60"))
    SURFACE_POOL_SIZE: int = int(os.getenv("SURFACE_POOL_SIZE", "10"))

    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    @classmethod
    def ensure_cache_dir(cls) -> Path:
        """Ensure cache directory exists."""
        cls.CACHE_DIR.mkdir(parents=True, exist_ok=True)
        return cls.CACHE_DIR

    @classmethod
    def get_device(cls) -> str:
        """Get the default CUDA device string."""
        return cls.DEFAULT_DEVICE


def get_config() -> Config:
    """Get the global configuration instance."""
    return Config()

