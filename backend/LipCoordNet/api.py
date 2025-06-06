from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import shutil
import os
import time
from inference import predict_lip_reading
import logging
from gtts import gTTS
from moviepy.editor import VideoFileClip, TextClip, CompositeVideoClip, AudioFileClip
import uuid
import subprocess
import cloudinary
import cloudinary.uploader

# Configure ImageMagick for moviepy
import moviepy.config as cf
cf.IMAGEMAGICK_BINARY = "magick"  # Heroku will install ImageMagick

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET")
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()
os.makedirs("static", exist_ok=True)  # Temporary local storage
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/healthz")
async def health_check():
    return {"status": "ok"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.content_type.startswith('video/'):
        logger.error(f"Invalid file type: {file.content_type}")
        return JSONResponse(content={"error": "Only video files are accepted"}, status_code=400)

    unique_id = str(uuid.uuid4())
    video_path = f"temp_{unique_id}_{file.filename}"
    video_copy_path = f"temp_copy_{unique_id}_{file.filename}"
    try:
        with open(video_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file.file.close()
        logger.info(f"Successfully saved video to {video_path}")

        weights_path = "pretrain/LipCoordNet_coords_loss_0.025581153109669685_wer_0.01746208431890914_cer_0.006488426950253695.pt"
        if not os.path.exists(weights_path):
            logger.error(f"Weights file not found: {weights_path}")
            raise FileNotFoundError(f"Weights file not found: {weights_path}")

        logger.info("Starting lip-reading prediction...")
        prediction = predict_lip_reading(
            video_path=video_path,
            weights_path=weights_path,
            device="cpu",
            output_path="static"
        )
        logger.info(f"Prediction completed: {prediction}")

        audio_path = f"static/audio_{unique_id}.mp3"
        tts = gTTS(text=prediction, lang='en')
        tts.save(audio_path)
        logger.info(f"Generated audio file: {audio_path}")

        shutil.copyfile(video_path, video_copy_path)
        logger.info(f"Created video copy for moviepy: {video_copy_path}")

        video = VideoFileClip(video_copy_path)
        txt_clip = TextClip(prediction, fontsize=24, color='white', bg_color='black', size=(video.w, None))
        txt_clip = txt_clip.set_position(('center', 'bottom')).set_duration(video.duration)
        final_video = CompositeVideoClip([video, txt_clip])
        audio = AudioFileClip(audio_path)
        final_video = final_video.set_audio(audio)
        output_video_path = f"static/video_{unique_id}.mp4"
        final_video.write_videofile(output_video_path, codec="libx264", audio_codec="aac")
        logger.info(f"Generated video file with captions and audio: {output_video_path}")

        video.close()
        txt_clip.close()
        audio.close()
        final_video.close()

        # Upload to Cloudinary
        audio_upload = cloudinary.uploader.upload(
            audio_path,
            resource_type="raw",
            public_id=f"audio_{unique_id}",
            folder="lipcoordnet"
        )
        video_upload = cloudinary.uploader.upload(
            output_video_path,
            resource_type="video",
            public_id=f"video_{unique_id}",
            folder="lipcoordnet"
        )
        audio_uri = audio_upload['secure_url']
        video_uri = video_upload['secure_url']
        logger.info(f"Uploaded to Cloudinary: {audio_uri}, {video_uri}")

        return JSONResponse(content={
            "prediction": prediction,
            "audioUri": audio_uri,
            "videoUri": video_uri
        })
    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        return JSONResponse(content={"error": str(e)}, status_code=500)
    finally:
        for temp_file in [video_path, video_copy_path, audio_path, output_video_path]:
            if os.path.exists(temp_file):
                retries = 5
                for attempt in range(retries):
                    try:
                        os.remove(temp_file)
                        logger.info(f"Removed temporary file: {temp_file}")
                        break
                    except PermissionError as pe:
                        logger.warning(f"Attempt {attempt + 1}/{retries}: Failed to delete {temp_file}. Retrying...")
                        time.sleep(2)
                else:
                    logger.error(f"Failed to remove temporary file after {retries} attempts: {temp_file}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)