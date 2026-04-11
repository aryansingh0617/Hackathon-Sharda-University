from google.adk.agents.llm_agent import Agent
from google.adk.tools import AgentTool
from .crop_doctor_tools import analyze_leaf_image
from .gov_schemes_tools import search_gov_schemes
from .yieldcast_tools import predict_crop_yield
from .market_analysis_tools import get_mandi_prices
from .AgriScore import calculate_esg_score
from dotenv import load_dotenv
load_dotenv()

# =====================================================================
# WEEK 1: THE CORE AGENTS
# =====================================================================

crop_doctor_agent = Agent(
    name="crop_doctor",
    model="gemini-2.5-flash",
    description="Use this agent whenever a user provides an image path. It analyzes leaf images and outputs a concise English treatment plan.",
    instruction=(
        "You are an agricultural botanist. "
        "1. Extract the absolute file path (e.g., D:/...) from the user's request. "
        "2. Call the 'analyze_leaf_image' tool. CRITICAL: You must pass the image path using the correct JSON parameter expected by the tool (usually 'image_path'). "
        "3. Return a STRICTLY concise, bulleted treatment plan (organic & chemical) and the name of the disease in English based on the tool's output. "
        "CRITICAL: Do NOT add conversational filler. Output ONLY the data."
    ),
    tools=[analyze_leaf_image]
)

# =====================================================================
# WEEK 2: PLACEHOLDER AGENTS
# =====================================================================

yieldcast_agent = Agent(
    name="yieldcast",
    model="gemini-2.5-flash",
    description="Use this agent when the user asks to predict crop yield, estimate harvest volume, or analyze weather impacts on their farm.",
    instruction=(
        "You are an elite Agricultural Data Scientist. "
        "1. Read the user's request for crop type, location, and conditions. "
        "2. Pass a summary string to the 'predict_crop_yield' tool to trigger the backend model. "
        "3. You will receive a raw JSON data payload from the tool. "
        "4. Translate that JSON data into a highly professional, beautifully formatted Yield Forecast Report for the user. "
        "CRITICAL: Always mention the 'Model Confidence Score' to build trust with the user."
    ),
    tools=[predict_crop_yield]
)

gov_schemes_agent = Agent(
    name="gov_schemes",
    model="gemini-2.5-flash",
    description="Use this agent when the user asks about government subsidies, loans, insurance, or financial schemes for farmers.",
    instruction=(
        "You are an expert advisor on Indian agricultural government schemes. "
        "1. Extract the core keyword from the user's request (e.g., 'loan', 'insurance', 'PM-Kisan'). "
        "2. Use the 'search_gov_schemes' tool to find relevant information. "
        "3. Format the tool's output into a helpful, easy-to-read response. Do NOT invent schemes that the tool does not provide."
    ),
    tools=[search_gov_schemes]
)

market_analysis_agent = Agent(
    name="market_analysis",
    model="gemini-2.5-flash",
    description="Use this agent when the user asks about current market prices, Mandi rates, selling their crop, or market trends.",
    instruction=(
        "You are an expert Agricultural Economist. "
        "1. Extract the crop name from the user's request. "
        "2. Pass it to the 'get_mandi_prices' tool to fetch current market data. "
        "3. You will receive a JSON payload with prices, trends, and financial advice. "
        "4. Format this data into a clear, professional Market Update report. Always include the price, the 24-hour trend, and the AI financial advice."
    ),
    tools=[get_mandi_prices]
)

AgriScore_agent = Agent(
    name="agriscore",
    model="gemini-2.5-flash",
    description="Calculates AgriScore.",
    instruction=(
        "CRITICAL: You MUST use the calculate_esg_score tool. "
        "You MUST pass EXACTLY a valid JSON string and nothing else. "
        "Example: {\"yield_metric\": 80, \"land_quality\": 70, \"financial_health\": 60, \"market_access\": 50, \"climate_risk\": 40, \"govt_support\": 80, \"farmer_profile\": 75} "
        "DO NOT use markdown formatting like ```json in the tool call. Just the raw string."
    ),
    tools=[calculate_esg_score]
)

# =====================================================================
# THE MASTER ORCHESTRATOR (The Router, Translator & Gatekeeper)
# =====================================================================

root_agent = Agent(
    name="agrisentinel_master",
    model="gemini-2.5-flash",
    instruction=(
        "You are the AgriSentinel Master Orchestrator. Your job is to act as the central brain. "
        "Read the user's request and dynamically route the task to the correct specialist agent based on their descriptions.\n\n"
        "🛑 CRITICAL SCOPE GUARDRAIL: You are strictly an agricultural assistant. If a user asks a question that is ENTIRELY UNRELATED to farming, agriculture, crops, market prices, or agricultural schemes, DO NOT route the request to any agent. Instead, reply politely with: 'I am sorry, but as the AgriSentinel AI, I am specialized strictly in agriculture and farming. I cannot help with that.'\n\n"
        "HOW TO CALL SUB-AGENTS (CRITICAL):\n"
        "When delegating to a sub-agent, you must pass the user's query into the 'request' parameter as a simple string. "
        "Example: request='What is the price of wheat in Hindi?'\n\n"
        "WORKFLOW:\n"
        "1. Delegate the user's query to the correct agent.\n"
        "2. Read the English output returned by the agent.\n"
        "3. Translate that exact information into the user's requested language yourself.\n"
        "4. Output the beautifully formatted, translated response directly to the user."
    ),
    tools=[
        AgentTool(agent=crop_doctor_agent),
        AgentTool(agent=yieldcast_agent),
        AgentTool(agent=gov_schemes_agent),
        AgentTool(agent=market_analysis_agent),
        AgentTool(agent=AgriScore_agent) # <-- BUG FIXED HERE
    ]
)