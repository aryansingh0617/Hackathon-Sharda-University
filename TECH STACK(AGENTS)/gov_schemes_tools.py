# gov_schemes_tools.py
import json

SCHEMES_DB = {
    "pm-kisan": "Pradhan Mantri Kisan Samman Nidhi provides Rs. 6000/year direct income support to eligible farmer families in 3 installments.",
    "pm-fby": "Pradhan Mantri Fasal Bima Yojana provides crop insurance against natural calamities, pests, and diseases at just 2% premium for Kharif crops.",
    "kcc": "Kisan Credit Card provides short-term crop loans up to Rs. 3 lakh at 4% interest rate with flexible repayment.",
    "pm-kisan-maandhan": "PM-Kisan Maan Dhan Yojana is a pension scheme providing Rs. 3000/month after age 60 for small and marginal farmers.",
    "pmkusum": "PM-KUSUM scheme provides 90% subsidy on solar irrigation pumps helping farmers save on electricity bills.",
    "enam": "eNAM National Agriculture Market allows farmers to sell crops online and get the best mandi prices across India.",
    "pkvy": "Paramparagat Krishi Vikas Yojana promotes organic farming with Rs. 50,000 per hectare financial support.",
    "soil-health": "Soil Health Card Scheme provides free soil testing every 2 years with crop-wise fertilizer recommendations.",
    "agri-infra-fund": "Agriculture Infrastructure Fund provides Rs. 1 lakh crore for post-harvest infrastructure at 3% interest subsidy.",
    "drip-irrigation": "Pradhan Mantri Krishi Sinchayee Yojana provides 55% subsidy on drip and sprinkler irrigation systems."
}


def search_gov_schemes(query: str) -> str:
    """
    TOOL: Searches the government scheme database for relevant schemes.
    Pass a keyword like 'insurance', 'loan', 'pension', 'solar', or scheme name.
    """
    query_lower = query.lower()
    results = []

    for key, description in SCHEMES_DB.items():
        if query_lower in key.lower() or query_lower in description.lower():
            results.append({"scheme_id": key.upper(), "details": description})

    if not results:
        # Return all schemes if no specific match
        all_schemes = [
            {"scheme_id": k.upper(), "details": v}
            for k, v in SCHEMES_DB.items()
        ]
        return json.dumps({
            "status": "no_exact_match",
            "message": f"No exact match for '{query}'. Showing all available schemes.",
            "schemes": all_schemes
        }, indent=2)

    return json.dumps({
        "status": "success",
        "query": query,
        "matches_found": len(results),
        "schemes": results
    }, indent=2)


if __name__ == "__main__":
    print(search_gov_schemes("insurance"))
    print(search_gov_schemes("loan"))