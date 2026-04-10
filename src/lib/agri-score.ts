type YieldSignal = {
  acres?: number;
  yieldPerAcre?: number;
  confidence?: number;
  diseasePressure?: number;
  grossRevenueMax?: number;
};

type IrrigationSignal = {
  urgency?: string;
  moistureGap?: number;
  evapStressIndex?: number;
  rainfallOffset?: number;
};

type DiagnosisSignal = {
  disease?: string;
  confidence?: string;
  source?: "vision" | "reasoning" | "fallback";
};

export type AgriScoreBreakdown = {
  score: number;
  rating: "A+" | "A" | "B+" | "B" | "C";
  risk: "Low" | "Guarded" | "Elevated";
  factors: {
    yieldStrength: number;
    irrigationDiscipline: number;
    cropHealth: number;
    revenuePower: number;
    dataTrust: number;
  };
};

function diseaseSeverityMultiplier(disease?: string) {
  const label = disease?.toLowerCase() ?? "";
  if (label.includes("late blight")) return 1.18;
  if (label.includes("bacterial")) return 1.12;
  if (label.includes("powdery mildew")) return 0.98;
  if (label.includes("leaf curl")) return 1.08;
  if (label.includes("early blight")) return 1.04;
  return 1;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function calculateAgriScore(input: {
  yieldSignal?: YieldSignal;
  irrigationSignal?: IrrigationSignal;
  diagnosisSignal?: DiagnosisSignal | null;
  historyCount?: number;
}): AgriScoreBreakdown {
  const yieldPerAcre = input.yieldSignal?.yieldPerAcre ?? 12.5;
  const yieldConfidence = input.yieldSignal?.confidence ?? 80;
  const diseasePressure = input.yieldSignal?.diseasePressure ?? 28;
  const revenueMax = input.yieldSignal?.grossRevenueMax ?? 180000;
  const acres = input.yieldSignal?.acres ?? 1;

  const irrigationUrgency = input.irrigationSignal?.urgency ?? "Low";
  const moistureGap = input.irrigationSignal?.moistureGap ?? 0.03;
  const evapStressIndex = input.irrigationSignal?.evapStressIndex ?? 38;
  const rainfallOffset = input.irrigationSignal?.rainfallOffset ?? 0;

  const diagnosisConfidence = Number.parseInt(input.diagnosisSignal?.confidence ?? "82", 10) || 82;
  const diagnosisSeverity = diseaseSeverityMultiplier(input.diagnosisSignal?.disease);
  const source = input.diagnosisSignal?.source ?? "fallback";
  const historyCount = input.historyCount ?? 0;
  const revenuePerAcre = revenueMax / Math.max(acres, 1);

  const yieldStrength = clamp(
    Math.round(yieldPerAcre * 5.4 + yieldConfidence * 0.62 - diseasePressure * 0.58),
    42,
    165,
  );
  const irrigationBase = irrigationUrgency === "High" ? 86 : irrigationUrgency === "Medium" ? 104 : 120;
  const irrigationDiscipline = clamp(
    Math.round(irrigationBase - moistureGap * 165 - evapStressIndex * 0.34 + rainfallOffset / 620),
    38,
    145,
  );
  const cropHealth = clamp(
    Math.round(diagnosisConfidence * 1.05 - diseasePressure * 0.6 * diagnosisSeverity),
    32,
    145,
  );
  const revenuePower = clamp(Math.round(42 + revenuePerAcre / 1650 + Math.log10(acres + 1) * 14), 40, 135);
  const dataTrust = clamp(
    Math.round(58 + historyCount * 7 + (source === "vision" ? 20 : source === "reasoning" ? 14 : 8)),
    42,
    115,
  );

  const score = clamp(255 + yieldStrength + irrigationDiscipline + cropHealth + revenuePower + dataTrust, 320, 860);
  const rating = score >= 800 ? "A+" : score >= 740 ? "A" : score >= 680 ? "B+" : score >= 610 ? "B" : "C";
  const risk = score >= 750 ? "Low" : score >= 660 ? "Guarded" : "Elevated";

  return {
    score,
    rating,
    risk,
    factors: {
      yieldStrength,
      irrigationDiscipline,
      cropHealth,
      revenuePower,
      dataTrust,
    },
  };
}
