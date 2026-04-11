import tensorflow as tf
import numpy as np
from PIL import Image
import os

print("🧠 Loading AgriSentinel Deep Learning Core...")

# Load the model we trained
model = tf.keras.models.load_model('crop_doctor_best_model.keras')

# our 38 exact class names
CLASS_NAMES = [
    'Apple___Apple_scab', 'Apple___Black_rot', 'Apple___Cedar_apple_rust', 'Apple___healthy',
    'Blueberry___healthy', 'Cherry_(including_sour)___Powdery_mildew', 'Cherry_(including_sour)___healthy',
    'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot', 'Corn_(maize)___Common_rust_',
    'Corn_(maize)___Northern_Leaf_Blight', 'Corn_(maize)___healthy', 'Grape___Black_rot',
    'Grape___Esca_(Black_Measles)', 'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)', 'Grape___healthy',
    'Orange___Haunglongbing_(Citrus_greening)', 'Peach___Bacterial_spot', 'Peach___healthy',
    'Pepper,_bell___Bacterial_spot', 'Pepper,_bell___healthy', 'Potato___Early_blight',
    'Potato___Late_blight', 'Potato___healthy', 'Raspberry___healthy', 'Soybean___healthy',
    'Squash___Powdery_mildew', 'Strawberry___Leaf_scorch', 'Strawberry___healthy',
    'Tomato___Bacterial_spot', 'Tomato___Early_blight', 'Tomato___Late_blight', 'Tomato___Leaf_Mold',
    'Tomato___Septoria_leaf_spot', 'Tomato___Spider_mites Two-spotted_spider_mite', 'Tomato___Target_Spot',
    'Tomato___Tomato_Yellow_Leaf_Curl_Virus', 'Tomato___Tomato_mosaic_virus', 'Tomato___healthy'
]

def analyze_leaf_image(image_path: str) -> dict:
    """
    This is the TOOL that your Agent will call.
    It takes an absolute file path to an image, runs it through the CNN, and returns the disease name.
    """
    try:
        # Check if the file actually exists on the hard drive before trying to open it
        if not os.path.exists(image_path):
            return {"status": "error", "message": f"Could not find the file at: {image_path}"}

        # 1. Open the image directly from the file path
        img = Image.open(image_path)
        if img.mode != 'RGB':
            img = img.convert('RGB')
        img = img.resize((224, 224))

        # 2. Prep for the AI
        img_array = tf.keras.preprocessing.image.img_to_array(img)
        img_array = img_array / 255.0
        img_batch = tf.expand_dims(img_array, 0)

        # 3. Make the prediction
        predictions = model.predict(img_batch, verbose=0)
        predicted_index = np.argmax(predictions[0])
        confidence = float(np.max(predictions[0]) * 100)
        disease_name = CLASS_NAMES[predicted_index]

        # Return a clean dictionary that the LLM agent can easily read
        return {
            "status": "success",
            "disease_detected": disease_name,
            "confidence": confidence,
            "is_healthy": "healthy" in disease_name.lower()
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}

# Quick local test to make sure it loaded correctly
if __name__ == "__main__":
    print("✅ Model loaded successfully and tool is ready for the Orchestrator!")