from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import shutil
import os
from inference import predict_lip_reading
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # Validate file type
    if not file.content_type.startswith('video/'):
        logger.error(f"Invalid file type: {file.content_type}")
        return JSONResponse(content={"error": "Only video files are accepted"}, status_code=400)

    video_path = f"temp_{file.filename}"
    try:
        # Save uploaded file
        with open(video_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        logger.info(f"Successfully saved video to {video_path}")

        # Verify weights file exists
        weights_path = "pretrain/LipCoordNet_coords_loss_0.025581153109669685_wer_0.01746208431890914_cer_0.006488426950253695.pt"
        if not os.path.exists(weights_path):
            logger.error(f"Weights file not found: {weights_path}")
            raise FileNotFoundError(f"Weights file not found: {weights_path}")

        # Perform lip-reading prediction
        logger.info("Starting lip-reading prediction...")
        prediction = predict_lip_reading(
            video_path=video_path,
            weights_path=weights_path,
            device="cpu",
            output_path="output_videos"
        )
        logger.info(f"Prediction completed: {prediction}")

        # Clean up temporary file
        if os.path.exists(video_path):
            os.remove(video_path)
            logger.info(f"Removed temporary file: {video_path}")

        return JSONResponse(content={"prediction": prediction})
    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        if os.path.exists(video_path):
            os.remove(video_path)
            logger.info(f"Removed temporary file due to error: {video_path}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)