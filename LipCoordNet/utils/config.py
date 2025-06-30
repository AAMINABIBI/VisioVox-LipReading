"""
Configuration Management
========================

Centralized configuration for the lipreading backend service.
Handles environment variables, paths, and application settings.
"""

import os
from typing import List

class Config:
    """Application configuration"""
    
    # Server Configuration
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8080))
    BASE_URL: str = os.getenv("BASE_URL", "http://192.168.100.19:8080")
    
    # CORS Configuration
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:19006",  # Expo dev server
        "exp://192.168.100.19:19000",  # Expo mobile
        "*"  # Allow all for development
    ]
    
    # Model Configuration
    WEIGHTS_PATH: str = os.getenv(
        "WEIGHTS_PATH",
        "pretrain/LipCoordNet_coords_loss_0.025581153109669685_wer_0.01746208431890914_cer_0.006488426950253695.pt"
    )
    DEVICE: str = os.getenv("DEVICE", "cpu")
    
    # External Dependencies
    IMAGEMAGICK_PATH: str = os.getenv(
        "IMAGEMAGICK_PATH",
        r"C:\Program Files\ImageMagick-7.1.1-Q16-HDRI\magick.exe"
    )
    
    # File Processing
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", 100 * 1024 * 1024))  # 100MB
    SUPPORTED_VIDEO_FORMATS: List[str] = ["mp4", "avi", "mov", "mkv"]
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # TTS Configuration
    TTS_LANGUAGE: str = os.getenv("TTS_LANGUAGE", "en")
    TTS_SLOW: bool = os.getenv("TTS_SLOW", "false").lower() == "true"
    
    # Video Processing
    VIDEO_CODEC: str = os.getenv("VIDEO_CODEC", "libx264")
    AUDIO_CODEC: str = os.getenv("AUDIO_CODEC", "aac")
    
    @classmethod
    def validate(cls) -> bool:
        """Validate configuration"""
        required_paths = [cls.WEIGHTS_PATH]
        
        for path in required_paths:
            if not os.path.exists(path):
                print(f"⚠️ Warning: Required file not found: {path}")
                return False
        
        return True
    
    @classmethod
    def print_config(cls) -> None:
        """Print current configuration"""
        print("🔧 Configuration:")
        print(f"  Server: {cls.HOST}:{cls.PORT}")
        print(f"  Base URL: {cls.BASE_URL}")
        print(f"  Device: {cls.DEVICE}")
        print(f"  Weights: {cls.WEIGHTS_PATH}")
        print(f"  Log Level: {cls.LOG_LEVEL}")
