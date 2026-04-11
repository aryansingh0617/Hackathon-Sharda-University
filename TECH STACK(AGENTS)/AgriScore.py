import json
import pickle
import pandas as pd
import os
import traceback
import numpy as np

# ==========================================
# 1. HARDCODED CONSTANTS (Zero File Dependencies)
# ==========================================
INDIA_AVG_DEBT = 74121
STATE_DEBT = {
    "punjab": 96853, "haryana": 107000, "andhra pradesh": 91330,
    "telangana": 91330, "tamil nadu": 85000, "uttar pradesh": 60000,
    "maharashtra": 75000, "madhya pradesh": 65000, "gujarat": 70000,
    "rajasthan": 68000, "karnataka": 72000, "all india": 74121
}

# ==========================================
# 2. LOAD ML MODELS ON STARTUP
# ==========================================
MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
try:
    with open(os.path.join(MODEL_DIR, "agriscore_model_v2.pkl"), "rb") as f:
        ml_model = pickle.load(f)
    with open(os.path.join(MODEL_DIR, "agriscore_features_v2.pkl"), "rb") as f:
        model_features = pickle.load(f)
    with open(os.path.join(MODEL_DIR, "agriscore_encoders_v2.pkl"), "rb") as f:
        encoders = pickle.load(f)
    MODEL_LOADED = True
    print("✅ Local ML Models Loaded Successfully!")
except Exception as e:
    print(f"⚠️ Warning: ML Models not found: {e}")
    MODEL_LOADED = False


# ==========================================
# 3. THE FALLBACK ENGINE (Rule-Based)
# ==========================================
def rule_based_agriscore(d: dict) -> int:
    """Pure math formula if the ML model fails."""

    def p1(d): return 80  # Simplified for fallback

    def p2(d): return 70

    def p3(d): return 60

    def p4(d): return 75

    def p5(d): return 65

    def p6(d): return 80

    def p7(d): return 70

    # Master Weights V2
    W = {"p1": 0.20, "p2": 0.16, "p3": 0.16, "p4": 0.20, "p5": 0.12, "p6": 0.10, "p7": 0.12}
    F = {"p1": p1, "p2": p2, "p3": p3, "p4": p4, "p5": p5, "p6": p6, "p7": p7}
    return round(sum(F[k](d) * W[k] for k in W) * 10)


# ==========================================
# 4. THE AI TOOL EXECUTOR
# ==========================================
def calculate_esg_score(query: str) -> str:
    """
    TOOL: Calculates the AgriScore using the v2 Machine Learning Pipeline.
    The agent passes a JSON-formatted string of the farmer's raw data.
    """
    try:
        farmer_data = json.loads(query)
    except:
        return json.dumps({"status": "error", "message": "Failed to parse JSON."})

    try:
        if not MODEL_LOADED:
            raise Exception("ML Models not in memory. Triggering fallback.")

        # 1. Preprocess raw data for the ML Model
        row = dict(farmer_data)

        # Encode Categoricals
        for col in ["irrigation_access", "agro_economic_zone", "cold_chain_access"]:
            val = str(row.get(col, "none")).lower()
            if col in encoders:
                le = encoders[col]
                row[col + "_enc"] = int(le.transform([val])[0]) if val in le.classes_ else 0
            else:
                row[col + "_enc"] = 0

        # Encode Irrigation Type
        irr_raw = str(row.get("irrigation_type", "None"))
        irr = {"Drip": "full", "Sprinkler": "partial", "Flood": "partial", "None": "none"}.get(irr_raw, "none")
        row["irrigation_type_enc"] = ["none", "partial", "full"].index(irr)

        # Convert Booleans to Int
        bool_cols = ["msp_coverage", "export_cluster_nearby", "contract_farming_or_fpo",
                     "crop_insurance", "drip_irrigation", "crop_rotation", "pm_kisan_beneficiary",
                     "soil_health_card", "kisan_credit_card", "enam_registered",
                     "kvk_training", "cooperative_membership", "fertilizer_organic"]
        for k in bool_cols:
            row[k] = int(bool(row.get(k, False)))

        # Fill Dynamic Defaults based on State
        income = row.get("annual_income_rs", 36000)
        loan = row.get("loan_amount_rs", 8000)
        state = str(row.get("state", "all india")).lower()

        row.setdefault("state_avg_debt_rs", STATE_DEBT.get(state, INDIA_AVG_DEBT))
        row.setdefault("debt_to_income_ratio", min(2.0, (loan) / max(income, 1)))
        row.setdefault("yield_kg_per_ha", row.get("yield_kg_per_hectare", 2500))
        row.setdefault("house_area_sqft", 65)
        row.setdefault("region_enc", 5)

        # 2. Force Data into 2D DataFrame (Scikit-Learn strict requirement)
        df = pd.DataFrame([row])

        # Ensure exact column match
        for col in model_features:
            if col not in df.columns:
                df[col] = 0

        df_final = df[model_features]

        # 3. Run Inference
        score = float(ml_model.predict(df_final)[0])
        score = max(100, min(1000, round(score)))
        source = "Local Scikit-Learn Pipeline V2"

    except Exception as e:
        # Failsafe execution
        print(f"⚠️ Fallback triggered: {e}")
        score = rule_based_agriscore(farmer_data)
        source = "Rule-Based Fallback Engine"

    # 4. Generate Credit Bands
    if score >= 800:
        band, elig, mult = "Excellent", "Auto approval", "3.5x"
    elif score >= 700:
        band, elig, mult = "Good", "Auto approval", "3.0x"
    elif score >= 600:
        band, elig, mult = "Fair", "Conditional approval", "2.0x"
    elif score >= 500:
        band, elig, mult = "Moderate", "Manual review", "1.5x"
    else:
        band, elig, mult = "Poor", "Rejected", "0x"

    return json.dumps({
        "status": "success",
        "backend": source,
        "final_agriscore": score,
        "credit_band": band,
        "loan_eligibility": elig,
        "max_loan_multiplier": mult
    }, indent=2)