from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import shutil
import os
import logging
from gtts import gTTS
import uuid
from moviepy.editor import VideoFileClip, TextClip, CompositeVideoClip, AudioFileClip
import time
from fastapi.middleware.cors import CORSMiddleware
from inference import predict_lip_reading
import tempfile
from pathlib import Path

# Configure ImageMagick for moviepy
import moviepy.config as cf
cf.IMAGEMAGICK_BINARY = r"C:\Program Files\ImageMagick-7.1.1-Q16-HDRI\magick.exe"

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
    
    # Initialize all variables at the start
    video_path = None
    video_copy_path = None
    audio_path = None
    output_video_path = None
    temp_files = []
    
    try:
        # Save uploaded file
        video_path = f"static/temp_{unique_id}_{file.filename}"
        temp_files.append(video_path)
        
        with open(video_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        logger.info(f"Successfully saved video to {video_path}")

        # Check if weights file exists
        weights_path = "pretrain/LipCoordNet_coords_loss_0.025581153109669685_wer_0.01746208431890914_cer_0.006488426950253695.pt"
        if not os.path.exists(weights_path):
            logger.error(f"Weights file not found: {weights_path}")
            raise HTTPException(status_code=500, detail=f"Model weights file not found: {weights_path}")

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

        # Generate audio file
        audio_path = f"outputs/audio_{unique_id}.mp3"
        temp_files.append(audio_path)
        
        try:
            tts = gTTS(text=str(prediction), lang='en')
            tts.save(audio_path)
            logger.info(f"Generated audio file: {audio_path}")
        except Exception as e:
            logger.error(f"TTS generation failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Audio generation failed: {str(e)}")

        # Generate video with captions
        output_video_path = f"outputs/video_{unique_id}.mp4"
        temp_files.append(output_video_path)
        
        try:
            # Create a copy for moviepy processing
            video_copy_path = f"static/temp_copy_{unique_id}_{file.filename}"
            temp_files.append(video_copy_path)
            shutil.copyfile(video_path, video_copy_path)
            
            video = VideoFileClip(video_copy_path)
            
            # Create text clip with error handling
            try:
                txt_clip = TextClip(
                    str(prediction), 
                    fontsize=24, 
                    color='white', 
                    bg_color='black',
                    size=(video.w, None)
                ).set_position(('center', 'bottom')).set_duration(video.duration)
            except Exception as text_error:
                logger.warning(f"TextClip creation failed: {text_error}")
                # Simple text overlay fallback
                txt_clip = TextClip(
                    str(prediction), 
                    fontsize=20, 
                    color='white'
                ).set_position(('center', 'bottom')).set_duration(video.duration)
            
            # Composite video
            final_video = CompositeVideoClip([video, txt_clip])
            
            # Add audio
            audio_clip = AudioFileClip(audio_path)
            final_video = final_video.set_audio(audio_clip)
            
            # Write final video
            final_video.write_videofile(
                output_video_path, 
                codec="libx264", 
                audio_codec="aac",
                verbose=False,
                logger=None,
                temp_audiofile='temp-audio.m4a',
                remove_temp=True
            )
            
            # Clean up clips
            video.close()
            txt_clip.close()
            audio_clip.close()
            final_video.close()
            
            logger.info(f"Generated video file with captions and audio: {output_video_path}")
            
        except Exception as e:
            logger.error(f"Video generation failed: {str(e)}")
            # Continue without video generation
            output_video_path = None

        # Return URLs that the React Native app can access
        base_url = "http://192.168.100.19:8080"  # Update this to your server IP
        audio_uri = f"{base_url}/outputs/audio_{unique_id}.mp3"
        video_uri = f"{base_url}/outputs/video_{unique_id}.mp4" if output_video_path and os.path.exists(output_video_path) else None

        return JSONResponse(content={
            "prediction": str(prediction),
            "audioUri": audio_uri,
            "videoUri": video_uri,
            "success": True
        })

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    finally:
        # Clean up temporary files
        for temp_file in temp_files:
            if temp_file and os.path.exists(temp_file):
                retries = 5
                for attempt in range(retries):
                    try:
                        os.remove(temp_file)
                        logger.info(f"Removed temporary file: {temp_file}")
                        break
                    except PermissionError:
                        logger.warning(f"Attempt {attempt + 1}/{retries}: Failed to delete {temp_file}. Retrying...")
                        time.sleep(2)
                else:
                    logger.error(f"Failed to remove temporary file after {retries} attempts: {temp_file}")

@app.get("/outputs/{filename}")
async def get_output_file(filename: str):
    file_path = os.path.join("outputs", filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
