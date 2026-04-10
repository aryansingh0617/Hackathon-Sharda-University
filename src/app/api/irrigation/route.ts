import { NextResponse } from "next/server";
import { persistFarmIntelEvent } from "@/lib/farm-intel-store";

export const runtime = "nodejs";

type Body = {
  soilMoisture?: number;
  forecastMm?: number;
  temperatureC?: number;
  humidity?: number;
  cropStage?: "seedling" | "vegetative" | "flowering" | "fruiting" | string;
};

const STAGE_TARGETS: Record<string, { targetMoisture: number; baseWaterLiters: number }> = {
  seedling: { targetMoisture: 0.32, baseWaterLiters: 4200 },
  vegetative: { targetMoisture: 0.36, baseWaterLiters: 5600 },
  flowering: { targetMoisture: 0.42, baseWaterLiters: 7400 },
  fruiting: { targetMoisture: 0.45, baseWaterLiters: 8200 },
};

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {}

  const soil = Number.isFinite(body.soilMoisture) ? Math.max(0, Math.min(1, Number(body.soilMoisture))) : 0.35;
  const rain = Number.isFinite(body.forecastMm) ? Math.max(0, Math.min(60, Number(body.forecastMm))) : 0;
  const temp = Number.isFinite(body.temperatureC) ? Math.max(8, Math.min(48, Number(body.temperatureC))) : 30;
  const humidity = Number.isFinite(body.humidity) ? Math.max(15, Math.min(98, Number(body.humidity))) : 58;
  const cropStage = body.cropStage && STAGE_TARGETS[body.cropStage] ? body.cropStage : "vegetative";
  const stageConfig = STAGE_TARGETS[cropStage];

  const targetMoisture = stageConfig.targetMoisture;
  const moistureGap = Math.max(0, Math.round((targetMoisture - soil) * 100) / 100);
  const evapStressIndex = Math.max(0, Math.min(100, Math.round((temp - humidity * 0.12) * 2.8)));
  const rainfallOffset = Math.round(rain * 420);
  const rawWaterNeed = Math.max(0, Math.round(stageConfig.baseWaterLiters + moistureGap * 18000 + evapStressIndex * 26));
  const waterLitersPerAcre = Math.max(0, rawWaterNeed - rainfallOffset);

  let decision = "Hold";
  let urgency = "Low";
  let nextReviewHours = 18;
  let reasoning = "Moisture is close to target. Monitor field conditions and reassess later.";

  if (rain >= 8) {
    decision = "Skip irrigation";
    urgency = "Low";
    nextReviewHours = 24;
    reasoning = `Rain forecast is ${rain} mm, which should cover near-term water demand. Avoid overwatering.`;
  } else if (moistureGap >= 0.1 || (soil < 0.3 && temp >= 34)) {
    decision = "Irrigate now";
    urgency = "High";
    nextReviewHours = 6;
    reasoning = `Soil moisture is below target by ${moistureGap.toFixed(2)} and heat stress is elevated. Water immediately to protect the crop stage.`;
  } else if (moistureGap >= 0.05) {
    decision = "Irrigate today";
    urgency = "Medium";
    nextReviewHours = 10;
    reasoning = `Root-zone moisture is trending low. Schedule irrigation today to restore the target band.`;
  }

  const payload = {
    decision,
    urgency,
    reasoning,
    waterLitersPerAcre,
    nextReviewHours,
    targetMoisture,
    currentMoisture: soil,
    moistureGap,
    evapStressIndex,
    rainfallOffset,
    inputs: {
      soilMoisture: soil,
      forecastMm: rain,
      temperatureC: temp,
      humidity,
      cropStage,
    },
  };

  const farmIntel = await persistFarmIntelEvent({
    eventType: "irrigation",
    entityKey: `${cropStage}:${soil.toFixed(2)}:${rain}:${temp}`,
    sourceLayer: "intelligence",
    confidencePct: Math.max(62, 92 - Math.round(moistureGap * 100) - Math.round(rain / 3)),
    recommendationLabel: decision,
    seasonTag: cropStage,
    sourceMode: "irrigation_model_v1",
    payload,
  });

  return NextResponse.json({
    ...payload,
    farmIntel,
  });
}
