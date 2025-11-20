"""CUDA device management."""

import torch
from typing import Optional
from engine.core.config import Config
from engine.core.exceptions import GPUError


class DeviceManager:
    """Manages CUDA device selection and operations."""

    def __init__(self, device: Optional[str] = None):
        """Initialize device manager."""
        self.device_str = device or Config.get_device()
        self.device = torch.device(self.device_str)

        if not torch.cuda.is_available():
            raise GPUError("CUDA is not available")

        if "cuda" in self.device_str and not torch.cuda.is_available():
            raise GPUError(f"CUDA device {self.device_str} is not available")

        # Set memory fraction if needed
        if torch.cuda.is_available():
            max_memory = Config.MAX_GPU_MEMORY_GB * 1024 * 1024 * 1024  # Convert to bytes
            torch.cuda.set_per_process_memory_fraction(
                max_memory / torch.cuda.get_device_properties(0).total_memory
            )

    def get_device(self) -> torch.device:
        """Get the torch device."""
        return self.device

    def clear_cache(self):
        """Clear GPU cache."""
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

    def get_memory_info(self) -> dict:
        """Get GPU memory information."""
        if not torch.cuda.is_available():
            return {"available": False}

        return {
            "available": True,
            "allocated": torch.cuda.memory_allocated(self.device) / 1024**3,  # GB
            "reserved": torch.cuda.memory_reserved(self.device) / 1024**3,  # GB
            "total": torch.cuda.get_device_properties(self.device).total_memory / 1024**3,  # GB
        }

