import os
from dotenv import load_dotenv
from google.adk.agents import LlmAgent
from crop_doctor_tools import run_cnn_diagnosis

# Load your API key
load_dotenv()
os.environ["GEMINI_API_KEY"] = os.getenv("GEMINI_API_KEY")

# =====================================================================
# AGENT 1: THE MEDICAL SPECIALIST (Crop Doctor)
# =====================================================================
crop_doctor_agent = LlmAgent(
    name="crop_doctor",
    model="gemini-2.5-flash",
    instruction=(
        "You are an elite agricultural botanist and plant pathologist. "
        "When given an image path, you MUST use the 'run_cnn_diagnosis' tool. "
        "Once the tool gives you the mathematical disease prediction, output a "
        "comprehensive treatment plan in English including: "
        "1. Disease Name, 2. Severity, 3. Organic Remedies, 4. Chemical Remedies."
    ),
    tools=[run_cnn_diagnosis] # The ADK handles the tool binding automatically!
)

# =====================================================================
# AGENT 2: THE LOCALIZATION SPECIALIST (Multilingual Translator)
# =====================================================================
multilingual_agent = LlmAgent(
    name="multilingual_translator",
    model="gemini-2.5-flash",
    instruction=(
        "You are an expert agricultural translator working for Indian farmers. "
        "You will receive English agricultural treatment plans and a target language. "
        "Your only job is to translate the plan perfectly into the requested regional language. "
        "Keep the formatting clean and use terminology familiar to Indian farmers."
    )
)