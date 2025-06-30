"""
Computer Vision Transforms
==========================

Image and video transformation utilities for preprocessing.
Includes data augmentation and normalization functions.
"""

import random
import numpy as np
from typing import Union

def horizontal_flip(batch_img: np.ndarray, p: float = 0.5) -> np.ndarray:
    """
    Apply horizontal flip augmentation to batch of images
    
    Args:
        batch_img: Input batch with shape (T, H, W, C)
        p: Probability of applying flip (default: 0.5)
    
    Returns:
        Transformed batch of images
    """
    if random.random() > p:
        batch_img = batch_img[:, :, ::-1, ...]
    return batch_img

def color_normalize(batch_img: np.ndarray) -> np.ndarray:
    """
    Normalize pixel values to [0, 1] range
    
    Args:
        batch_img: Input batch with pixel values in [0, 255]
    
    Returns:
        Normalized batch with values in [0, 1]
    """
    return batch_img / 255.0

def resize_batch(
    batch_img: np.ndarray, 
    target_size: tuple = (64, 128)
) -> np.ndarray:
    """
    Resize batch of images to target size
    
    Args:
        batch_img: Input batch with shape (T, H, W, C)
        target_size: Target (height, width)
    
    Returns:
        Resized batch of images
    """
    import cv2
    
    resized_batch = []
    for img in batch_img:
        resized = cv2.resize(img, target_size[::-1])  # cv2 uses (W, H)
        resized_batch.append(resized)
    
    return np.stack(resized_batch, axis=0)

def apply_transforms(
    batch_img: np.ndarray,
    training: bool = False,
    flip_prob: float = 0.5
) -> np.ndarray:
    """
    Apply complete transformation pipeline
    
    Args:
        batch_img: Input batch
        training: Whether in training mode (applies augmentations)
        flip_prob: Probability of horizontal flip
    
    Returns:
        Transformed batch
    """
    # Apply augmentations only during training
    if training:
        batch_img = horizontal_flip(batch_img, p=flip_prob)
    
    # Always apply normalization
    batch_img = color_normalize(batch_img)
    
    return batch_img

# Legacy function names for backward compatibility
HorizontalFlip = horizontal_flip
ColorNormalize = color_normalize
