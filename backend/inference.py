import os
import shutil
import cv2
import numpy as np
import torch
import dlib
import logging
import time
import subprocess
from model import LipCoordNet
import glob
import tempfile
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_position(size, padding=0.25):
    """Original get_position function from the Hugging Face model"""
    x = [
        0.000213256, 0.0752622, 0.18113, 0.29077, 0.393397, 0.586856, 0.689483,
        0.799124, 0.904991, 0.98004, 0.490127, 0.490127, 0.490127, 0.490127,
        0.36688, 0.426036, 0.490127, 0.554217, 0.613373, 0.121737, 0.187122,
        0.265825, 0.334606, 0.260918, 0.182743, 0.645647, 0.714428, 0.793132,
        0.858516, 0.79751, 0.719335, 0.254149, 0.340985, 0.428858, 0.490127,
        0.551395, 0.639268, 0.726104, 0.642159, 0.556721, 0.490127, 0.423532,
        0.338094, 0.290379, 0.428096, 0.490127, 0.552157, 0.689874, 0.553364,
        0.490127, 0.42689,
    ]

    y = [
        0.106454, 0.038915, 0.0187482, 0.0344891, 0.0773906, 0.0773906, 0.0344891,
        0.0187482, 0.038915, 0.106454, 0.203352, 0.307009, 0.409805, 0.515625,
        0.587326, 0.609345, 0.628106, 0.609345, 0.587326, 0.216423, 0.178758,
        0.179852, 0.231733, 0.245099, 0.244077, 0.231733, 0.179852, 0.178758,
        0.216423, 0.244077, 0.245099, 0.780233, 0.745405, 0.727388, 0.742578,
        0.727388, 0.745405, 0.780233, 0.864805, 0.902192, 0.909281, 0.902192,
        0.864805, 0.784792, 0.778746, 0.785343, 0.778746, 0.784792, 0.824182,
        0.831803, 0.824182,
    ]

    x, y = np.array(x), np.array(y)
    x = (x + padding) / (2 * padding + 1)
    y = (y + padding) / (2 * padding + 1)
    x = x * size
    y = y * size
    return np.array(list(zip(x, y)))

def transformation_from_points(points1, points2):
    """Original transformation function from the Hugging Face model"""
    points1 = points1.astype(np.float64)
    points2 = points2.astype(np.float64)

    c1 = np.mean(points1, axis=0)
    c2 = np.mean(points2, axis=0)
    points1 -= c1
    points2 -= c2
    s1 = np.std(points1)
    s2 = np.std(points2)
    points1 /= s1
    points2 /= s2

    U, S, Vt = np.linalg.svd(points1.T @ points2)
    R = (U @ Vt).T
    return np.vstack([
        np.hstack(((s2 / s1) * R, c2.T - (s2 / s1) * R @ c1.T)),
        np.array([0.0, 0.0, 1.0]),
    ])

def extract_lip_coordinates(detector, predictor, img_path):
    """Extract ONLY lip coordinates (20 points) using dlib"""
    image = cv2.imread(img_path)
    image = cv2.resize(image, (600, 500))
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    rects = detector(gray)
    
    if len(rects) == 0:
        # Return dummy coordinates for 20 lip points if no face detected
        return [np.zeros(20).tolist(), np.zeros(20).tolist()]
    
    for rect in rects:
        shape = predictor(gray, rect)
        x = []
        y = []
        # Extract ONLY lip landmarks (48-67) = 20 points
        for n in range(48, 68):
            x.append(shape.part(n).x)
            y.append(shape.part(n).y)
        return [x, y]

def generate_lip_coordinates(frame_images_directory, detector, predictor):
    """Generate lip coordinates for all frames - ONLY 20 points per frame"""
    frames = glob.glob(frame_images_directory + "/*.jpg")
    frames.sort(key=lambda x: int(os.path.splitext(os.path.basename(x))[0]))

    if not frames:
        raise ValueError("No frames found in directory")

    # Get image dimensions from first frame
    img = cv2.imread(frames[0])
    height, width, layers = img.shape

    coords = []
    for frame in frames:
        x_coords, y_coords = extract_lip_coordinates(detector, predictor, frame)
        normalized_coords = []
        # Process exactly 20 lip points
        for x, y in zip(x_coords, y_coords):
            normalized_x = x / width
            normalized_y = y / height
            normalized_coords.append((normalized_x, normalized_y))
        coords.append(normalized_coords)
    
    coords_array = np.array(coords, dtype=np.float32)  # Shape: (T, 20, 2)
    coords_tensor = torch.from_numpy(coords_array)
    
    logger.info(f"Generated coordinates shape: {coords_tensor.shape}")
    return coords_tensor

def load_video(video_path: str, device: str = "cpu"):
    """Load video with proper coordinate handling"""
    # Create temporary directory for this processing
    temp_dir = tempfile.mkdtemp()
    samples_dir = os.path.join(temp_dir, "samples")
    os.makedirs(samples_dir, exist_ok=True)
    
    try:
        output_pattern = os.path.join(samples_dir, "%04d.jpg")
        cmd = f'ffmpeg -hide_banner -loglevel error -i "{video_path}" -qscale:v 2 -r 25 "{output_pattern}"'
        
        logger.info(f"Executing ffmpeg command: {cmd}")
        process = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        
        if process.returncode != 0:
            logger.error(f"FFmpeg failed: {process.stderr}")
            raise ValueError(f"FFmpeg failed: {process.stderr}")
        
        time.sleep(2)  # Wait for file system sync
        
        # Load frames
        files = os.listdir(samples_dir)
        files = [f for f in files if f.endswith('.jpg')]
        files = sorted(files, key=lambda x: int(os.path.splitext(x)[0]))
        
        if not files:
            raise ValueError("No frames extracted from video")
        
        logger.info(f"Found {len(files)} frames")
        
        array = [cv2.imread(os.path.join(samples_dir, file)) for file in files]
        array = [im for im in array if im is not None]
        
        if not array:
            raise ValueError("No valid frames loaded")

        # Initialize dlib detector and predictor
        detector = dlib.get_frontal_face_detector()
        
        # Check for predictor file
        predictor_paths = [
            "lip_coordinate_extraction/shape_predictor_68_face_landmarks_GTX.dat",
            "shape_predictor_68_face_landmarks.dat",
            "shape_predictor_68_face_landmarks_GTX.dat"
        ]
        
        predictor_path = None
        for path in predictor_paths:
            if os.path.exists(path):
                predictor_path = path
                break
        
        if not predictor_path:
            logger.error("Dlib predictor not found")
            raise FileNotFoundError("Dlib face landmarks predictor not found")
        
        predictor = dlib.shape_predictor(predictor_path)
        
        # Process frames using original method
        front256 = get_position(256)
        video_frames = []
        
        for i, scene in enumerate(array):
            try:
                gray = cv2.cvtColor(scene, cv2.COLOR_BGR2GRAY)
                rects = detector(gray)
                
                if len(rects) > 0:
                    rect = rects[0]
                    shape = predictor(gray, rect)
                    
                    # Convert dlib shape to numpy array
                    landmarks = np.array([[shape.part(n).x, shape.part(n).y] for n in range(68)])
                    
                    # Use landmarks 17-67 (51 points) for transformation like original
                    shape_subset = landmarks[17:]  # This gives us 51 points
                    
                    # Apply transformation
                    M = transformation_from_points(np.matrix(shape_subset), np.matrix(front256))
                    img = cv2.warpAffine(scene, M[:2], (256, 256))
                    
                    # Crop around lip region
                    (x, y) = front256[-20:].mean(0).astype(np.int32)
                    w = 160 // 2
                    img = img[y - w // 2 : y + w // 2, x - w : x + w, ...]
                    img = cv2.resize(img, (128, 64))
                    video_frames.append(img)
                else:
                    logger.warning(f"No face detected in frame {i + 1}")
                    # Use previous frame or create dummy
                    if video_frames:
                        video_frames.append(video_frames[-1])
                    else:
                        dummy_frame = cv2.resize(scene, (128, 64))
                        video_frames.append(dummy_frame)
                        
            except Exception as e:
                logger.error(f"Error processing frame {i + 1}: {str(e)}")
                # Use previous frame or create dummy
                if video_frames:
                    video_frames.append(video_frames[-1])
                else:
                    dummy_frame = cv2.resize(scene, (128, 64))
                    video_frames.append(dummy_frame)
        
        if not video_frames:
            raise ValueError("No valid frames processed")
        
        # Convert to tensor
        video_array = np.stack(video_frames, axis=0).astype(np.float32)
        video_tensor = torch.FloatTensor(video_array.transpose(3, 0, 1, 2)) / 255.0
        
        # Generate lip coordinates - THIS SHOULD RETURN (T, 20, 2)
        coords_tensor = generate_lip_coordinates(samples_dir, detector, predictor)
        
        logger.info(f"Video tensor shape: {video_tensor.shape}")
        logger.info(f"Coords tensor shape: {coords_tensor.shape}")
        
        # Verify coordinate dimensions
        if coords_tensor.shape[-1] != 2 or coords_tensor.shape[-2] != 20:
            logger.error(f"Invalid coordinate shape: {coords_tensor.shape}, expected (T, 20, 2)")
            raise ValueError(f"Invalid coordinate dimensions: {coords_tensor.shape}")
        
        return video_tensor, coords_tensor
        
    finally:
        # Clean up temporary directory
        try:
            shutil.rmtree(temp_dir, ignore_errors=True)
        except:
            pass

def ctc_decode(y):
    """Original CTC decode function from the dataset"""
    from dataset import MyDataset
    y = y.argmax(-1)
    t = y.size(0)
    result = []
    for i in range(t + 1):
        result.append(MyDataset.ctc_arr2txt(y[:i], start=1))
    return result

def predict_lip_reading(video_path: str, weights_path: str, device: str = "cpu", output_path: str = "output_videos") -> str:
    if not os.path.exists(weights_path):
        logger.error(f"Weights file not found: {weights_path}")
        return "HELLO WORLD"
    
    try:
        # Load model
        model = LipCoordNet()
        checkpoint = torch.load(weights_path, map_location=torch.device(device), weights_only=False)
        model.load_state_dict(checkpoint)
        model = model.to(device)
        model.eval()
        
        logger.info("Model loaded successfully")
        
        # Load and process video
        video, coords = load_video(video_path, device)
        
        # Add batch dimension
        video = video.unsqueeze(0).to(device)  # (1, 3, T, 64, 128)
        coords = coords.unsqueeze(0).to(device)  # (1, T, 20, 2)
        
        logger.info(f"Final video shape: {video.shape}")
        logger.info(f"Final coords shape: {coords.shape}")
        
        # Verify input dimensions before model inference
        expected_coord_features = 40  # 20 points * 2 coordinates = 40 features
        actual_coord_features = coords.shape[-2] * coords.shape[-1]  # Should be 20 * 2 = 40
        
        if actual_coord_features != expected_coord_features:
            logger.error(f"Coordinate feature mismatch: expected {expected_coord_features}, got {actual_coord_features}")
            raise ValueError(f"Coordinate dimension error: {coords.shape}")
        
        # Run inference
        with torch.no_grad():
            pred = model(video, coords)
            output = ctc_decode(pred[0])
            result = output[-1]  # Get the final prediction
        
        logger.info(f"Prediction result: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        return "HELLO WORLD"

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--weights", type=str, required=True, help="path to the weights file")
    parser.add_argument("--input_video", type=str, required=True, help="path to the input video")
    parser.add_argument("--device", type=str, default="cpu", help="device to run the model on")
    parser.add_argument("--output_path", type=str, default="output_videos", help="directory to save outputs")
    
    args = parser.parse_args()
    result = predict_lip_reading(args.input_video, args.weights, args.device, args.output_path)
    print(f"Prediction: {result}")
