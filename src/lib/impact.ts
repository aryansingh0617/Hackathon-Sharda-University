export type ImpactInput = {
  disease: string;
  confidence: string;
  treatment: string;
  cost: string;
};

export type ImpactMetrics = {
  yieldIncrease: string;
  costSaved: string;
  riskReduction: string;
  decisionConfidence: string;
};

export function generateImpact(result: ImpactInput): ImpactMetrics {
  const parsedConfidence = Number.parseInt(result.confidence, 10);
  const confidence = Number.isFinite(parsedConfidence) ? parsedConfidence : 80;
  const costMatch = result.cost.match(/(\d[\d,]*)/);
  const treatmentCost = costMatch ? Number.parseInt(costMatch[1].replace(/,/g, ""), 10) : 350;
  const disease = result.disease.toLowerCase();
  const diseasePressure = disease.includes("late blight")
    ? 1.3
    : disease.includes("bacterial")
      ? 1.18
      : disease.includes("leaf curl")
        ? 1.12
        : disease.includes("powdery mildew")
          ? 1.05
          : 1;

  const yieldLift = Math.max(8, Math.min(24, Math.round((confidence - 60) * 0.24 * diseasePressure)));
  const costSaved = Math.round(treatmentCost * (2.2 + confidence / 140));

  return {
    yieldIncrease: `${yieldLift}%`,
    costSaved: `₹${costSaved}`,
    riskReduction: confidence >= 88 ? "HIGH → LOW" : confidence >= 78 ? "MEDIUM → LOW" : "MEDIUM → GUARDED",
    decisionConfidence: `${confidence}%`,
  };
}
