"""GPU utility functions for memory transfer."""

import torch
import numpy as np
from typing import Tuple


def transfer_to_gpu(array: np.ndarray, device: torch.device) -> torch.Tensor:
    """Transfer numpy array to GPU tensor."""
    tensor = torch.from_numpy(array).to(device)
    return tensor


def transfer_to_cpu(tensor: torch.Tensor) -> np.ndarray:
    """Transfer GPU tensor to numpy array."""
    return tensor.cpu().numpy()


def ensure_contiguous(tensor: torch.Tensor) -> torch.Tensor:
    """Ensure tensor is contiguous in memory."""
    if not tensor.is_contiguous():
        return tensor.contiguous()
    return tensor

