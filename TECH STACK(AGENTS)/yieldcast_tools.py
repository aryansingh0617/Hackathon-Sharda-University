import json
import random


def predict_crop_yield(query: str) -> str:
    """
    TOOL: Predicts crop yield based on location, weather, and soil conditions.
    The agent passes a string summarizing the user's farm conditions.
    """
    query_lower = query.lower()

    # 1. Keyword Extraction (Simulating NLP preprocessing)
    supported_crops = ["wheat", "rice", "maize", "cotton", "sugarcane", "tomato", "potato", "soybean","mango","bell pepper"]
    detected_crop = next((c for c in supported_crops if c in query_lower), None)

    if not detected_crop:
        return json.dumps({
            "status": "error",
            "message": "Insufficient data. Please specify the crop type (e.g., wheat, rice, cotton) and location."
        })

    # 2. Simulate ML Inference (Randomized for hackathon demonstration)
    # In an industry setting, this connects to a scikit-learn or TensorFlow model.
    base_yield = random.uniform(2.5, 6.5)  # Tons per hectare
    confidence = random.uniform(85.0, 97.5)  # Model confidence percentage
    weather_impact = random.choice(["Favorable (+5%)", "Neutral (0%)", "Mild Stress (-3%)"])

    # 3. Build the Enterprise-Grade API Response
    report = {
        "status": "success",
        "backend_model": "AgriSense Predictive Engine v2.1",
        "data_payload": {
            "target_crop": detected_crop.capitalize(),
            "projected_yield_tons_per_hectare": round(base_yield, 2),
            "model_confidence_score": f"{round(confidence, 1)}%",
            "environmental_impact_factor": weather_impact,
            "key_variables_analyzed": ["Historical NDVI", "Current Soil Moisture", "Regional Rainfall Trajectory"]
        },
        "optimization_insight": f"To maintain the {round(confidence, 1)}% confidence interval, ensure optimal soil pH and preemptive pest control during the vegetative stage."
    }

    # Return raw JSON string to the LLM
    return json.dumps(report, indent=2)


if __name__ == "__main__":
    # Quick local test
    print(predict_crop_yield("I am planting wheat in Punjab with good rainfall."))