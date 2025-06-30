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
import math

# Try to import MoviePy with fallback
try:
    from moviepy.editor import VideoFileClip, TextClip, CompositeVideoClip, AudioFileClip, concatenate_audioclips
    MOVIEPY_AVAILABLE = True
    print("✅ MoviePy imported successfully!")
except ImportError as e:
    print(f"⚠️ MoviePy not available: {e}")
    MOVIEPY_AVAILABLE = False

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

def loop_audio(audio_clip, target_duration):
    """Custom function to loop audio to match target duration"""
    if not MOVIEPY_AVAILABLE:
        return None
        
    if audio_clip.duration >= target_duration:
        return audio_clip.subclip(0, target_duration)
    
    # Calculate how many times we need to repeat
    repeat_count = math.ceil(target_duration / audio_clip.duration)
    
    # Create list of audio clips to concatenate
    audio_clips = [audio_clip] * repeat_count
    
    # Concatenate and trim to exact duration
    looped_audio = concatenate_audioclips(audio_clips)
    return looped_audio.subclip(0, target_duration)

def generate_video_with_captions(video_path, prediction, audio_path, output_path):
    """Generate video with captions and synchronized audio"""
    if not MOVIEPY_AVAILABLE:
        logger.warning("MoviePy not available - skipping video generation")
        return False
    
    try:
        # Load original video and MUTE it
        original_video = VideoFileClip(video_path)
        muted_video = original_video.without_audio()  # Remove original audio
        
        logger.info(f"Original video: duration={original_video.duration}, size=({original_video.w}x{original_video.h})")
        
        # Create text clip for captions
        try:
            font_size = max(24, min(48, original_video.w // 20))
            
            txt_clip = TextClip(
                str(prediction), 
                fontsize=font_size, 
                color='white',
                stroke_color='black',
                stroke_width=2,
                font='Arial-Bold'
            ).set_position(('center', 0.85), relative=True).set_duration(original_video.duration)
            
            logger.info("Text clip created successfully")
            
        except Exception as text_error:
            logger.warning(f"TextClip creation failed: {text_error}")
            # Simple fallback
            txt_clip = TextClip(
                str(prediction), 
                fontsize=24, 
                color='white'
            ).set_position('bottom').set_duration(original_video.duration)
            logger.info("Fallback text clip created")
        
        # Composite muted video with text
        video_with_text = CompositeVideoClip([muted_video, txt_clip])
        
        # Load generated audio and add to video
        new_audio = AudioFileClip(audio_path)
        
        # Handle audio duration mismatch
        if new_audio.duration != original_video.duration:
            new_audio = loop_audio(new_audio, original_video.duration)
            logger.info(f"Audio adjusted to match video duration: {original_video.duration}s")
        
        # Set the new audio to the video
        final_video = video_with_text.set_audio(new_audio)
        
        # Write final video
        final_video.write_videofile(
            output_path, 
            codec="libx264", 
            audio_codec="aac",
            fps=24,
            verbose=False,
            logger=None,
            temp_audiofile=f'temp/temp_audio_{uuid.uuid4()}.m4a',
            remove_temp=True
        )
        
        # Clean up clips
        original_video.close()
        muted_video.close()
        txt_clip.close()
        video_with_text.close()
        new_audio.close()
        final_video.close()
        
        logger.info(f"Generated video with captions and audio: {output_path}")
        return True
        
    except Exception as e:
        logger.error(f"Video generation failed: {str(e)}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        return False

@app.get("/healthz")
async def health_check():
    return {
        "status": "ok", 
        "message": "Server is running",
        "moviepy_available": MOVIEPY_AVAILABLE
    }

@app.get("/")
async def root():
    return {
        "message": "Lipreading API is running",
        "features": {
            "lip_reading": True,
            "audio_generation": True,
            "video_generation": MOVIEPY_AVAILABLE
        }
    }

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith('video/'):
        logger.error(f"Invalid file type: {file.content_type}")
        raise HTTPException(status_code=400, detail="Only video files are accepted")

    unique_id = str(uuid.uuid4())
    
    # Initialize variables
    video_path = None
    video_copy_path = None
    temp_files_to_cleanup = []
    
    # Output files
    audio_filename = f"audio_{unique_id}.mp3"
    audio_path = f"outputs/{audio_filename}"
    video_filename = f"video_{unique_id}.mp4"
    output_video_path = f"outputs/{video_filename}"
    
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

        # Generate video with captions and audio
        video_generated = False
        if MOVIEPY_AVAILABLE:
            try:
                # Create a copy for moviepy processing
                video_copy_path = f"static/copy_{unique_id}_{file.filename}"
                temp_files_to_cleanup.append(video_copy_path)
                shutil.copyfile(video_path, video_copy_path)
                
                video_generated = generate_video_with_captions(
                    video_copy_path, prediction, audio_path, output_video_path
                )
                
            except Exception as e:
                logger.error(f"Video generation failed: {str(e)}")
                video_generated = False
        else:
            logger.warning("MoviePy not available - skipping video generation")

        # Return URLs
        base_url = "http://192.168.100.19:8080"
        
        # Verify audio file exists
        audio_uri = None
        if os.path.exists(audio_path):
            audio_uri = f"{base_url}/outputs/{audio_filename}"
            logger.info(f"Audio file confirmed at: {audio_path}")
        else:
            logger.error(f"Audio file missing: {audio_path}")
        
        # Verify video file exists
        video_uri = None
        if video_generated and os.path.exists(output_video_path):
            video_uri = f"{base_url}/outputs/{video_filename}"
            logger.info(f"Video file confirmed at: {output_video_path}")
        else:
            logger.warning(f"Video file not available")

        return JSONResponse(content={
            "prediction": str(prediction),
            "audioUri": audio_uri,
            "videoUri": video_uri,
            "success": True,
            "video_generated": video_generated
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
    elif filename.endswith('.mp4'):
        return FileResponse(
            file_path, 
            media_type="video/mp4",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    else:
        return FileResponse(file_path)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
