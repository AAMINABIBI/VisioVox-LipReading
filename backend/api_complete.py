# from fastapi import FastAPI, File, UploadFile, HTTPException, Request
# from fastapi.responses import JSONResponse, FileResponse
# from fastapi.staticfiles import StaticFiles
# import shutil
# import os
# import logging
# from gtts import gTTS
# import uuid
# from fastapi.middleware.cors import CORSMiddleware
# from inference import predict_lip_reading
# import tempfile
# from pathlib import Path
# from dotenv import load_dotenv
# from slowapi import Limiter, _rate_limit_exceeded_handler
# from slowapi.util import get_remote_address
# from slowapi.errors import RateLimitExceeded
# import cv2

# # Configure logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# # Load environment variables
# load_dotenv()
# # BASE_URL = os.getenv("BASE_URL", "http://16.171.195.132:8080")
# BASE_URL = os.getenv("BASE_URL", "https://final-visiovox-backend-production.up.railway.app")

# WEIGHTS_PATH = os.getenv("WEIGHTS_PATH", "pretrain/LipCoordNet_coords_loss_0.025581153109669685_wer_0.01746208431890914_cer_0.006488426950253695.pt")

# app = FastAPI(
#     title="Lipreading API",
#     description="API for lip-reading from videos with audio output",
#     version="1.0.0"
# )

# # Create directories
# os.makedirs("static", exist_ok=True)
# os.makedirs("uploads", exist_ok=True)
# os.makedirs("outputs", exist_ok=True)

# # Mount static files
# app.mount("/static", StaticFiles(directory="static"), name="static")
# app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

# # Add CORS middleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Add rate limiting
# limiter = Limiter(key_func=get_remote_address)
# app.state.limiter = limiter
# app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# @app.middleware("http")
# async def log_requests(request, call_next):
#     logger.info(f"Incoming request: {request.method} {request.url}")
#     response = await call_next(request)
#     logger.info(f"Response status: {response.status_code}")
#     return response

# @app.on_event("shutdown")
# async def cleanup_outputs():
#     output_dir = "outputs"
#     for file in os.listdir(output_dir):
#         file_path = os.path.join(output_dir, file)
#         if os.path.isfile(file_path) and file.endswith(".mp3"):
#             try:
#                 os.remove(file_path)
#                 logger.info(f"Cleaned up {file_path}")
#             except Exception as e:
#                 logger.warning(f"Failed to clean up {file_path}: {str(e)}")

# @app.get("/healthz")
# async def health_check():
#     return {
#         "status": "ok",
#         "message": "Server is running",
#         "lip_reading_available": True,
#         "audio_generation_available": True
#     }

# @app.get("/")
# async def root():
#     return {
#         "message": "Lipreading API is running",
#         "features": {
#             "lip_reading": True,
#             "audio_generation": True,
#             "video_generation": False
#         }
#     }

# @app.post("/predict")
# @limiter.limit("5/minute")
# async def predict(file: UploadFile = File(...), request: Request = None):
#     allowed_extensions = [".mp4", ".mov", ".avi"]
#     file_ext = os.path.splitext(file.filename or "")[1].lower()
#     if not file_ext or file_ext not in allowed_extensions:
#         logger.error(f"Invalid file extension: {file_ext}")
#         raise HTTPException(status_code=400, detail="Only MP4, MOV, or AVI files are accepted")
#     content = await file.read()
#     if len(content) > 100 * 1024 * 1024:
#         logger.error("File size exceeds 100MB")
#         raise HTTPException(status_code=413, detail="File too large. Max 100MB.")
#     unique_id = str(uuid.uuid4())
#     temp_dir = tempfile.mkdtemp()
#     video_path = os.path.join(temp_dir, f"temp_{unique_id}_{file.filename or 'video.mp4'}")
#     audio_filename = f"audio_{unique_id}.mp3"
#     audio_path = os.path.join("outputs", audio_filename)
#     try:
#         logger.info(f"Attempting to save video to {video_path}")
#         with open(video_path, "wb") as buffer:
#             buffer.write(content)
#         logger.info(f"Successfully saved video to {video_path}")
#         cap = cv2.VideoCapture(video_path)
#         if not cap.isOpened():
#             logger.error(f"Invalid video file: {video_path}")
#             raise HTTPException(status_code=400, detail="Invalid video file. Cannot open video.")
#         fps = cap.get(cv2.CAP_PROP_FPS)
#         frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
#         width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
#         height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
#         logger.info(f"Video properties: FPS={fps}, Frames={frame_count}, Duration={frame_count/fps if fps > 0 else 0}s, Resolution={width}x{height}")
#         cap.release()
#         if fps < 24 or fps > 30 or width < 100 or height < 100:
#             logger.error(f"Video format unsupported: FPS={fps}, Resolution={width}x{height}")
#             raise HTTPException(status_code=400, detail="Video must have FPS between 24-30 and minimum resolution of 100x100")
#         if not os.path.exists(WEIGHTS_PATH):
#             logger.error(f"Weights file not found: {WEIGHTS_PATH}")
#             raise HTTPException(status_code=404, detail="Model weights not found")
#         logger.info(f"Starting lip-reading prediction with weights: {WEIGHTS_PATH}")
#         try:
#             prediction = predict_lip_reading(
#                 video_path=video_path,
#                 weights_path=WEIGHTS_PATH,
#                 device="cpu",
#                 output_path="static"
#             )
#         except Exception as e:
#             logger.error(f"Prediction failed: {str(e)}")
#             raise HTTPException(status_code=500, detail=f"Lip-reading prediction failed: {str(e)}")
#         if not isinstance(prediction, str) or not prediction.strip():
#             logger.error("Invalid prediction output")
#             raise HTTPException(status_code=500, detail="Lip-reading prediction returned invalid output")
#         logger.info(f"Prediction completed: {prediction}")
#         logger.info(f"Generating audio for prediction: {prediction}")
#         tts = gTTS(text=str(prediction), lang='en', slow=False)
#         tts.save(audio_path)
#         logger.info(f"Generated audio file: {audio_path}")
#         if not os.path.exists(audio_path):
#             logger.error(f"Audio file was not created: {audio_path}")
#             raise HTTPException(status_code=500, detail="Audio file was not created")
#         audio_uri = f"{BASE_URL}/outputs/{audio_filename}" if os.path.exists(audio_path) else None
#         logger.info(f"Returning response with audio_uri: {audio_uri}")
#         return JSONResponse(content={
#             "prediction": str(prediction),
#             "audioUri": audio_uri,
#             "videoUri": None,
#             "success": True,
#             "video_generated": False
#         })
#     except HTTPException as he:
#         logger.error(f"HTTPException: {str(he)}", exc_info=True)
#         raise
#     except Exception as e:
#         logger.error(f"Unexpected error during prediction: {str(e)}", exc_info=True)
#         raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
#     finally:
#         try:
#             shutil.rmtree(temp_dir, ignore_errors=True)
#             logger.info(f"Cleaned up temp directory: {temp_dir}")
#         except Exception as e:
#             logger.warning(f"Could not remove temp directory {temp_dir}: {str(e)}")

# @app.get("/outputs/{filename}")
# async def get_output_file(filename: str):
#     file_path = os.path.join("outputs", filename)
#     if not os.path.exists(file_path):
#         logger.error(f"File not found: {file_path}")
#         raise HTTPException(status_code=404, detail="File not found")
#     if filename.endswith('.mp3'):
#         return FileResponse(
#             file_path,
#             media_type="audio/mpeg",
#             headers={"Content-Disposition": f"attachment; filename={filename}"}
#         )
#     else:
#         return FileResponse(file_path)

# if __name__ == "__main__":
#     import uvicorn
#     port = int(os.environ.get("PORT", 8080))
#     uvicorn.run(app, host="0.0.0.0", port=port)












from fastapi import FastAPI, File, UploadFile, HTTPException, Request
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
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import cv2

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
BASE_URL = os.getenv("BASE_URL", "https://final-visiovox-backend-production.up.railway.app")
if BASE_URL.startswith("http://192.168.") or BASE_URL.startswith("http://10.") or BASE_URL.startswith("http://172."):
    logger.warning(f"BASE_URL is set to a private IP: {BASE_URL}. Overriding to Railway public URL.")
    BASE_URL = "https://final-visiovox-backend-production.up.railway.app"
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

# Add rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.middleware("http")
async def log_requests(request, call_next):
    logger.info(f"Incoming request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response

@app.on_event("shutdown")
async def cleanup_outputs():
    output_dir = "outputs"
    for file in os.listdir(output_dir):
        file_path = os.path.join(output_dir, file)
        if os.path.isfile(file_path) and file.endswith(".mp3"):
            try:
                os.remove(file_path)
                logger.info(f"Cleaned up {file_path}")
            except Exception as e:
                logger.warning(f"Failed to clean up {file_path}: {str(e)}")

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
@limiter.limit("5/minute")
async def predict(file: UploadFile = File(...), request: Request = None):
    allowed_extensions = [".mp4", ".mov", ".avi"]
    file_ext = os.path.splitext(file.filename or "")[1].lower()
    if not file_ext or file_ext not in allowed_extensions:
        logger.error(f"Invalid file extension: {file_ext}")
        raise HTTPException(status_code=400, detail="Only MP4, MOV, or AVI files are accepted")
    content = await file.read()
    if len(content) > 100 * 1024 * 1024:
        logger.error("File size exceeds 100MB")
        raise HTTPException(status_code=413, detail="File too large. Max 100MB.")
    unique_id = str(uuid.uuid4())
    temp_dir = tempfile.mkdtemp()
    video_path = os.path.join(temp_dir, f"temp_{unique_id}_{file.filename or 'video.mp4'}")
    audio_filename = f"audio_{unique_id}.mp3"
    audio_path = os.path.join("outputs", audio_filename)
    try:
        logger.info(f"Attempting to save video to {video_path}")
        with open(video_path, "wb") as buffer:
            buffer.write(content)
        logger.info(f"Successfully saved video to {video_path}")
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            logger.error(f"Invalid video file: {video_path}")
            raise HTTPException(status_code=400, detail="Invalid video file. Cannot open video.")
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        logger.info(f"Video properties: FPS={fps}, Frames={frame_count}, Duration={frame_count/fps if fps > 0 else 0}s, Resolution={width}x{height}")
        cap.release()
        if fps < 24 or fps > 30 or width < 100 or height < 100:
            logger.error(f"Video format unsupported: FPS={fps}, Resolution={width}x{height}")
            raise HTTPException(status_code=400, detail="Video must have FPS between 24-30 and minimum resolution of 100x100")
        if not os.path.exists(WEIGHTS_PATH):
            logger.error(f"Weights file not found: {WEIGHTS_PATH}")
            raise HTTPException(status_code=404, detail="Model weights not found")
        logger.info(f"Starting lip-reading prediction with weights: {WEIGHTS_PATH}")
        try:
            prediction = predict_lip_reading(
                video_path=video_path,
                weights_path=WEIGHTS_PATH,
                device="cpu",
                output_path="static"
            )
        except Exception as e:
            logger.error(f"Prediction failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Lip-reading prediction failed: {str(e)}")
        if not isinstance(prediction, str) or not prediction.strip():
            logger.error("Invalid prediction output")
            raise HTTPException(status_code=500, detail="Lip-reading prediction returned invalid output")
        logger.info(f"Prediction completed: {prediction}")
        logger.info(f"Generating audio for prediction: {prediction}")
        tts = gTTS(text=str(prediction), lang='en', slow=False)
        tts.save(audio_path)
        logger.info(f"Generated audio file: {audio_path}")
        if not os.path.exists(audio_path):
            logger.error(f"Audio file was not created: {audio_path}")
            raise HTTPException(status_code=500, detail="Audio file was not created")
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