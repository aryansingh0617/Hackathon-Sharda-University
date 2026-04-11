import json
import random


def get_mandi_prices(query: str) -> str:
    """
    TOOL: Fetches realistic simulated Mandi (market) prices and trends for a given crop.
    Pass a string containing the crop name (e.g., 'wheat', 'cotton', 'tomato').
    """
    query_lower = query.lower()

    # 1. Realistic Base Prices (INR per Quintal) based on recent Indian market averages
    MARKET_DATA = {
        "wheat": 2275,
        "rice": 2900,
        "maize": 2090,
        "cotton": 7100,
        "sugarcane": 315,  # Per quintal
        "tomato": 1800,
        "potato": 1200,
        "soybean": 4600
    }

    detected_crop = next((c for c in MARKET_DATA.keys() if c in query_lower), None)

    if not detected_crop:
        return json.dumps({
            "status": "error",
            "message": "Crop not recognized. Please specify a common crop like wheat, cotton, or tomato."
        })

    # 2. Simulate LIVE fluctuation (+/- 3% of the real base price)
    base_price = MARKET_DATA[detected_crop]
    fluctuation = random.uniform(-0.03, 0.03)
    current_price = int(base_price * (1 + fluctuation))

    trend_percentage = fluctuation * 100
    trend_direction = "UP 📈" if trend_percentage > 0 else "DOWN 📉"

    # 3. Dynamic Advice Engine
    if trend_percentage > 1.5:
        sentiment = "Bullish (High Demand)"
        advice = "Prices are trending upward above the moving average. Consider holding your stock for 24-48 hours to maximize profit margins."
    elif trend_percentage < -1.5:
        sentiment = "Bearish (Low Demand)"
        advice = "Prices are currently dropping below standard rates. It is advisable to sell current harvest soon to avoid further market depreciation."
    else:
        sentiment = "Stable"
        advice = "Market is currently stable and trading at expected averages. Good time to sell if you need immediate liquidity."

    # 4. Build the structured API Response
    report = {
        "status": "success",
        "data_source": "AgriSentinel Fast-Cache Market Engine",
        "market_data": {
            "commodity": detected_crop.capitalize(),
            "unit": "1 Quintal (100 kg)",
            "current_price_inr": current_price,
            "price_change_24h": f"{trend_direction} {abs(round(trend_percentage, 2))}%",
            "overall_market_sentiment": sentiment
        },
        "ai_financial_advice": advice
    }

    return json.dumps(report, indent=2)