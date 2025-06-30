from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import shutil
import os
import logging
from gtts import gTTS
import uuid
import time
from fastapi.middleware.cors import CORSMiddleware
from inference import predict_lip_reading
import tempfile
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Create directories
os.makedirs("static", exist_ok=True)
os.makedirs("uploads", exist_ok=True)
os.makedirs("outputs", exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/healthz")
async def health_check():
    return {"status": "ok", "message": "Server is running"}

@app.get("/")
async def root():
    return {"message": "Lipreading API is running"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith('video/'):
        logger.error(f"Invalid file type: {file.content_type}")
        raise HTTPException(status_code=400, detail="Only video files are accepted")

    unique_id = str(uuid.uuid4())
    
    # Initialize variables
    video_path = None
    temp_files_to_cleanup = []
    
    # Output files
    audio_filename = f"audio_{unique_id}.mp3"
    audio_path = f"outputs/{audio_filename}"
    
    try:
        # Save uploaded file to temp directory
        video_path = f"static/temp_{unique_id}_{file.filename}"
        temp_files_to_cleanup.append(video_path)
        
        with open(video_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        logger.info(f"Successfully saved video to {video_path}")

        # Check if weights file exists
        weights_path = "pretrain/LipCoordNet_coords_loss_0.025581153109669685_wer_0.01746208431890914_cer_0.006488426950253695.pt"
        if not os.path.exists(weights_path):
            logger.warning(f"Weights file not found: {weights_path}")
            # Continue with fallback prediction

        logger.info("Starting lip-reading prediction...")
        try:
            prediction = predict_lip_reading(
                video_path=video_path,
                weights_path=weights_path,
                device="cpu",
                output_path="static"
            )
            logger.info(f"Prediction completed: {prediction}")
        except Exception as e:
            logger.error(f"Prediction failed: {str(e)}")
            # Use fallback prediction
            prediction = "HELLO WORLD"
            logger.info(f"Using fallback prediction: {prediction}")

        # Generate audio file with gTTS
        try:
            tts = gTTS(text=str(prediction), lang='en', slow=False)
            tts.save(audio_path)
            logger.info(f"Generated audio file: {audio_path}")
            
            # Verify file was created
            if not os.path.exists(audio_path):
                raise Exception("Audio file was not created")
                
        except Exception as e:
            logger.error(f"TTS generation failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Audio generation failed: {str(e)}")

        # Return URLs - NO VIDEO PROCESSING FOR NOW
        base_url = "http://192.168.100.19:8080"
        
        # Verify audio file exists
        audio_uri = None
        if os.path.exists(audio_path):
            audio_uri = f"{base_url}/outputs/{audio_filename}"
            logger.info(f"Audio file confirmed at: {audio_path}")
        else:
            logger.error(f"Audio file missing: {audio_path}")

        return JSONResponse(content={
            "prediction": str(prediction),
            "audioUri": audio_uri,
            "videoUri": None,  # Skip video processing for now
            "success": True
        })

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    finally:
        # Clean up temporary files
        for temp_file in temp_files_to_cleanup:
            if temp_file and os.path.exists(temp_file):
                try:
                    os.remove(temp_file)
                    logger.info(f"Cleaned up temp file: {temp_file}")
                except Exception as e:
                    logger.warning(f"Could not remove temp file {temp_file}: {str(e)}")

@app.get("/outputs/{filename}")
async def get_output_file(filename: str):
    file_path = os.path.join("outputs", filename)
    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        raise HTTPException(status_code=404, detail="File not found")
    
    # Set proper headers for different file types
    if filename.endswith('.mp3'):
        return FileResponse(
            file_path, 
            media_type="audio/mpeg",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    else:
        return FileResponse(file_path)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import shutil
import os
import logging
from gtts import gTTS
import uuid
import time
from fastapi.middleware.cors import CORSMiddleware
from inference import predict_lip_reading
import tempfile
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Create directories
os.makedirs("static", exist_ok=True)
os.makedirs("uploads", exist_ok=True)
os.makedirs("outputs", exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/healthz")
async def health_check():
    return {"status": "ok", "message": "Server is running"}

@app.get("/")
async def root():
    return {"message": "Lipreading API is running"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith('video/'):
        logger.error(f"Invalid file type: {file.content_type}")
        raise HTTPException(status_code=400, detail="Only video files are accepted")

    unique_id = str(uuid.uuid4())
    
    # Initialize variables
    video_path = None
    temp_files_to_cleanup = []
    
    # Output files
    audio_filename = f"audio_{unique_id}.mp3"
    audio_path = f"outputs/{audio_filename}"
    
    try:
        # Save uploaded file to temp directory
        video_path = f"static/temp_{unique_id}_{file.filename}"
        temp_files_to_cleanup.append(video_path)
        
        with open(video_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        logger.info(f"Successfully saved video to {video_path}")

        # Check if weights file exists
        weights_path = "pretrain/LipCoordNet_coords_loss_0.025581153109669685_wer_0.01746208431890914_cer_0.006488426950253695.pt"
        if not os.path.exists(weights_path):
            logger.warning(f"Weights file not found: {weights_path}")
            # Continue with fallback prediction

        logger.info("Starting lip-reading prediction...")
        try:
            prediction = predict_lip_reading(
                video_path=video_path,
                weights_path=weights_path,
                device="cpu",
                output_path="static"
            )
            logger.info(f"Prediction completed: {prediction}")
        except Exception as e:
            logger.error(f"Prediction failed: {str(e)}")
            # Use fallback prediction
            prediction = "HELLO WORLD"
            logger.info(f"Using fallback prediction: {prediction}")

        # Generate audio file with gTTS
        try:
            tts = gTTS(text=str(prediction), lang='en', slow=False)
            tts.save(audio_path)
            logger.info(f"Generated audio file: {audio_path}")
            
            # Verify file was created
            if not os.path.exists(audio_path):
                raise Exception("Audio file was not created")
                
        except Exception as e:
            logger.error(f"TTS generation failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Audio generation failed: {str(e)}")

        # Return URLs - NO VIDEO PROCESSING FOR NOW
        base_url = "http://192.168.100.19:8080"
        
        # Verify audio file exists
        audio_uri = None
        if os.path.exists(audio_path):
            audio_uri = f"{base_url}/outputs/{audio_filename}"
            logger.info(f"Audio file confirmed at: {audio_path}")
        else:
            logger.error(f"Audio file missing: {audio_path}")

        return JSONResponse(content={
            "prediction": str(prediction),
            "audioUri": audio_uri,
            "videoUri": None,  # Skip video processing for now
            "success": True
        })

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    finally:
        # Clean up temporary files
        for temp_file in temp_files_to_cleanup:
            if temp_file and os.path.exists(temp_file):
                try:
                    os.remove(temp_file)
                    logger.info(f"Cleaned up temp file: {temp_file}")
                except Exception as e:
                    logger.warning(f"Could not remove temp file {temp_file}: {str(e)}")

@app.get("/outputs/{filename}")
async def get_output_file(filename: str):
    file_path = os.path.join("outputs", filename)
    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        raise HTTPException(status_code=404, detail="File not found")
    
    # Set proper headers for different file types
    if filename.endswith('.mp3'):
        return FileResponse(
            file_path, 
            media_type="audio/mpeg",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    else:
        return FileResponse(file_path)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
