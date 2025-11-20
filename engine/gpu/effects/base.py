"""Base class for GPU effects."""

import torch
from typing import Dict, Any
from abc import ABC, abstractmethod


class BaseEffect(ABC):
    """Base class for all GPU effects."""

    def __init__(self, device: torch.device):
        """Initialize effect with device."""
        self.device = device

    @abstractmethod
    def apply(self, frame: torch.Tensor) -> torch.Tensor:
        """Apply effect to frame tensor (H, W, C) or (B, H, W, C)."""
        pass

    def to(self, device: torch.device) -> "BaseEffect":
        """Move effect to different device."""
        self.device = device
        return self

    def parameters(self) -> Dict[str, Any]:
        """Get effect parameters for serialization."""
        return {"device": str(self.device)}

