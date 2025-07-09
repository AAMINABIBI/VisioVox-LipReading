from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import shutil
import os
import logging
from gtts import gTTS
import uuid
from fastapi.middleware.cors import CORSMiddleware
from inference import predict_lip_reading
import tempfile
from pathlib import Path
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
BASE_URL = os.getenv("BASE_URL", "https://final-visiovox-backend-production.up.railway.app")
WEIGHTS_PATH = os.getenv("WEIGHTS_PATH", "pretrain/LipCoordNet_coords_loss_0.025581153109669685_wer_0.01746208431890914_cer_0.006488426950253695.pt")

app = FastAPI(
    title="Lipreading API",
    description="API for lip-reading from videos with audio output",
    version="1.0.0"
)

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

@app.middleware("http")
async def log_requests(request, call_next):
    logger.info(f"Incoming request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response

@app.get("/healthz")
async def health_check():
    return {
        "status": "ok",
        "message": "Server is running",
        "lip_reading_available": True,
        "audio_generation_available": True
    }

@app.get("/")
async def root():
    return {
        "message": "Lipreading API is running",
        "features": {
            "lip_reading": True,
            "audio_generation": True,
            "video_generation": False
        }
    }

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    allowed_types = ["video/mp4", "video/quicktime", "video/x-msvideo"]
    if not file.content_type or file.content_type not in allowed_types:
        logger.error(f"Invalid file type: {file.content_type}")
        raise HTTPException(status_code=400, detail="Only MP4, MOV, or AVI files are accepted")

    # Validate file size (100MB limit)
    content = await file.read()
    if len(content) > 100 * 1024 * 1024:
        logger.error("File size exceeds 100MB")
        raise HTTPException(status_code=413, detail="File too large. Max 100MB.")

    unique_id = str(uuid.uuid4())
    
    # Initialize variables
    temp_dir = tempfile.mkdtemp()
    video_path = os.path.join(temp_dir, f"temp_{unique_id}_{file.filename or 'video.mp4'}")
    audio_filename = f"audio_{unique_id}.mp3"
    audio_path = os.path.join("outputs", audio_filename)
    
    try:
        # Save uploaded file
        logger.info(f"Attempting to save video to {video_path}")
        with open(video_path, "wb") as buffer:
            buffer.write(content)
        logger.info(f"Successfully saved video to {video_path}")

        # Check weights file
        if not os.path.exists(WEIGHTS_PATH):
            logger.error(f"Weights file not found: {WEIGHTS_PATH}")
            raise HTTPException(status_code=404, detail="Model weights not found")

        # Run lip-reading prediction
        try:
            logger.info(f"Starting lip-reading prediction with weights: {WEIGHTS_PATH}")
            prediction = predict_lip_reading(
                video_path=video_path,
                weights_path=WEIGHTS_PATH,
                device="cpu",
                output_path="static"
            )
            logger.info(f"Prediction completed: {prediction}")
        except Exception as e:
            logger.error(f"Prediction failed: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Lip-reading prediction failed: {str(e)}")

        # Generate audio
        try:
            logger.info(f"Generating audio for prediction: {prediction}")
            tts = gTTS(text=str(prediction), lang='en', slow=False)
            tts.save(audio_path)
            logger.info(f"Generated audio file: {audio_path}")
            if not os.path.exists(audio_path):
                logger.error(f"Audio file was not created: {audio_path}")
                raise HTTPException(status_code=500, detail="Audio file was not created")
        except Exception as e:
            logger.error(f"TTS generation failed: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Audio generation failed: {str(e)}")

        # Prepare response
        audio_uri = f"{BASE_URL}/outputs/{audio_filename}" if os.path.exists(audio_path) else None
        logger.info(f"Returning response with audio_uri: {audio_uri}")

        return JSONResponse(content={
            "prediction": str(prediction),
            "audioUri": audio_uri,
            "videoUri": None,
            "success": True,
            "video_generated": False
        })

    except HTTPException as he:
        logger.error(f"HTTPException: {str(he)}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"Unexpected error during prediction: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    finally:
        # Clean up temporary directory
        try:
            shutil.rmtree(temp_dir, ignore_errors=True)
            logger.info(f"Cleaned up temp directory: {temp_dir}")
        except Exception as e:
            logger.warning(f"Could not remove temp directory {temp_dir}: {str(e)}")

@app.get("/outputs/{filename}")
async def get_output_file(filename: str):
    file_path = os.path.join("outputs", filename)
    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        raise HTTPException(status_code=404, detail="File not found")
    
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