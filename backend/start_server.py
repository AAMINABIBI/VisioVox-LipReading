#!/usr/bin/env python3
"""
Server Startup Script
=====================

Enhanced startup script for the lipreading backend service.
Includes dependency checking, environment validation, and graceful startup.
"""

import os
import sys
import subprocess
import signal
import time
from pathlib import Path

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from utils.config import Config
from utils.logger import setup_logger

logger = setup_logger("startup")

class ServerManager:
    """Manages server startup, validation, and shutdown"""
    
    def __init__(self):
        self.server_process = None
        self.setup_signal_handlers()
    
    def setup_signal_handlers(self):
        """Setup graceful shutdown handlers"""
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
    
    def signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        logger.info(f"🛑 Received signal {signum}, shutting down gracefully...")
        self.shutdown()
        sys.exit(0)
    
    def check_dependencies(self) -> bool:
        """Check if all required dependencies are available"""
        logger.info("🔍 Checking dependencies...")
        
        required_files = [
            "api.py",
            "inference.py",
            "model.py",
            "dataset.py",
            "requirements.txt"
        ]
        
        missing_files = []
        for file in required_files:
            if not os.path.exists(file):
                missing_files.append(file)
        
        if missing_files:
            logger.error(f"❌ Missing required files: {missing_files}")
            return False
        
        # Check model weights
        if not os.path.exists(Config.WEIGHTS_PATH):
            logger.warning(f"⚠️ Model weights not found: {Config.WEIGHTS_PATH}")
            logger.warning("   Please ensure the model weights file is available")
        
        # Check dlib predictor
        predictor_paths = [
            "lip_coordinate_extraction/shape_predictor_68_face_landmarks_GTX.dat",
            "shape_predictor_68_face_landmarks.dat"
        ]
        
        predictor_found = any(os.path.exists(path) for path in predictor_paths)
        if not predictor_found:
            logger.warning("⚠️ Dlib face landmarks predictor not found")
            logger.warning("   Download from: http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2")
        
        # Check FFmpeg
        try:
            subprocess.run(["ffmpeg", "-version"], 
                         capture_output=True, check=True)
            logger.info("✅ FFmpeg is available")
        except (subprocess.CalledProcessError, FileNotFoundError):
            logger.warning("⚠️ FFmpeg not found - video processing may fail")
        
        logger.info("✅ Dependency check completed")
        return True
    
    def install_dependencies(self) -> bool:
        """Install Python dependencies"""
        try:
            logger.info("📦 Installing dependencies...")
            
            # Upgrade pip first
            subprocess.check_call([
                sys.executable, "-m", "pip", "install", "--upgrade", "pip"
            ])
            
            # Install requirements
            subprocess.check_call([
                sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
            ])
            
            logger.info("✅ Dependencies installed successfully")
            return True
            
        except subprocess.CalledProcessError as e:
            logger.error(f"❌ Failed to install dependencies: {e}")
            return False
    
    def create_directories(self) -> None:
        """Create necessary directories"""
        directories = [
            "static", "uploads", "outputs", "temp", 
            "pretrain", "samples", "logs"
        ]
        
        for directory in directories:
            os.makedirs(directory, exist_ok=True)
            logger.debug(f"📁 Directory ready: {directory}")
        
        logger.info("✅ Directories created")
    
    def validate_environment(self) -> bool:
        """Validate environment configuration"""
        logger.info("🔧 Validating environment...")
        
        # Print configuration
        Config.print_config()
        
        # Validate configuration
        if not Config.validate():
            logger.error("❌ Environment validation failed")
            return False
        
        logger.info("✅ Environment validation passed")
        return True
    
    def start_server(self) -> None:
        """Start the FastAPI server"""
        try:
            logger.info("🚀 Starting FastAPI server...")
            logger.info(f"   Server will be available at: {Config.BASE_URL}")
            logger.info(f"   API documentation: {Config.BASE_URL}/docs")
            
            # Start server
            cmd = [
                sys.executable, "-m", "uvicorn",
                "api:app",
                "--host", Config.HOST,
                "--port", str(Config.PORT),
                "--reload",
                "--log-level", Config.LOG_LEVEL.lower()
            ]
            
            logger.info(f"   Command: {' '.join(cmd)}")
            
            self.server_process = subprocess.Popen(cmd)
            
            # Wait for server to start
            time.sleep(2)
            
            if self.server_process.poll() is None:
                logger.info("✅ Server started successfully")
                logger.info("   Press Ctrl+C to stop the server")
                
                # Keep the script running
                self.server_process.wait()
            else:
                logger.error("❌ Server failed to start")
                
        except KeyboardInterrupt:
            logger.info("🛑 Server stopped by user")
        except Exception as e:
            logger.error(f"❌ Failed to start server: {e}")
    
    def shutdown(self) -> None:
        """Gracefully shutdown the server"""
        if self.server_process and self.server_process.poll() is None:
            logger.info("🛑 Stopping server...")
            self.server_process.terminate()
            
            # Wait for graceful shutdown
            try:
                self.server_process.wait(timeout=10)
                logger.info("✅ Server stopped gracefully")
            except subprocess.TimeoutExpired:
                logger.warning("⚠️ Force killing server...")
                self.server_process.kill()
    
    def run(self) -> None:
        """Main execution flow"""
        logger.info("🎤 Lipreading Backend Server")
        logger.info("=" * 50)
        
        # Step 1: Check dependencies
        if not self.check_dependencies():
            logger.error("❌ Dependency check failed")
            sys.exit(1)
        
        # Step 2: Create directories
        self.create_directories()
        
        # Step 3: Install dependencies
        if not self.install_dependencies():
            logger.error("❌ Failed to install dependencies")
            sys.exit(1)
        
        # Step 4: Validate environment
        if not self.validate_environment():
            logger.error("❌ Environment validation failed")
            sys.exit(1)
        
        # Step 5: Start server
        self.start_server()

def main():
    """Main entry point"""
    try:
        server_manager = ServerManager()
        server_manager.run()
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
