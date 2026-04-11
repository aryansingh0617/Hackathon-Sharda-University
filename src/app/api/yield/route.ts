import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { persistFarmIntelEvent } from "@/lib/farm-intel-store";
import { CROP_MARKET_PROFILES, normalizeCropKey } from "@/lib/agri-market";

export const runtime = "nodejs";

type Body = {
  crop?: string;
  district?: string;
  acres?: number;
  soilHealth?: number;
  rainfallMm7d?: number;
  diseasePressure?: number;
};

function stableDistrictAdjustment(district: string) {
  const hash = createHash("sha256").update(district.toLowerCase()).digest("hex");
  const bucket = Number.parseInt(hash.slice(0, 6), 16) % 7;
  return 0.94 + bucket * 0.015;
}

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {}

  const crop = normalizeCropKey(body.crop);
  const district = body.district?.trim() || "Nashik";
  const acres = Math.max(0.25, Math.min(50, Number(body.acres ?? 1)));
  const soilHealth = Math.max(40, Math.min(95, Number(body.soilHealth ?? 72)));
  const rainfallMm7d = Math.max(0, Math.min(140, Number(body.rainfallMm7d ?? 18)));
  const diseasePressure = Math.max(0, Math.min(100, Number(body.diseasePressure ?? 28)));
  const profile = CROP_MARKET_PROFILES[crop];

  const soilFactor = 0.88 + ((soilHealth - 40) / 55) * 0.2;
  const rainfallDelta = Math.abs(rainfallMm7d - profile.idealRainMm7d);
  const rainfallFactor = Math.max(0.82, 1 - rainfallDelta / 125);
  const diseaseFactor = Math.max(0.76, 1 - diseasePressure / 170);
  const acreageFactor = 1 + Math.min(0.03, Math.log10(acres + 1) * 0.02);
  const districtFactor = stableDistrictAdjustment(district);

  const tonsPerAcre =
    profile.baseTonsPerAcre * soilFactor * rainfallFactor * diseaseFactor * acreageFactor * districtFactor;
  const midTons = Math.max(0.4, Math.round(tonsPerAcre * acres * 100) / 100);
  const bandWidth = Math.max(0.12, Math.round(midTons * (0.08 + profile.priceVolatilityPct / 1000) * 100) / 100);
  const minTons = Math.max(0.25, Math.round((midTons - bandWidth) * 100) / 100);
  const maxTons = Math.max(minTons + 0.08, Math.round((midTons + bandWidth) * 100) / 100);
  const confidence = Math.max(
    64,
    Math.min(93, Math.round(87 - rainfallDelta * 0.42 - diseasePressure * 0.18 + (soilHealth - 70) * 0.16)),
  );

  const grossRevenueMin = Math.round(minTons * profile.marketPricePerTon);
  const grossRevenueMax = Math.round(maxTons * profile.marketPricePerTon);
  const yieldPerAcre = Math.round((midTons / acres) * 100) / 100;
  const yieldVsBenchmarkPct = Math.round((yieldPerAcre / profile.benchmarkTonsPerAcre) * 100);
  const estimatedProductionCost = Math.round(profile.productionCostPerAcre * acres);
  const netRevenueMin = Math.max(0, grossRevenueMin - estimatedProductionCost);
  const netRevenueMax = Math.max(0, grossRevenueMax - estimatedProductionCost);
  const harvestWindowDays = Math.max(
    7,
    Math.round(profile.harvestWindowDays + (diseasePressure - 25) / 18 - (soilHealth - 70) / 22),
  );

  const payload = {
    crop,
    district,
    acres,
    soilHealth,
    rainfallMm7d,
    diseasePressure,
    minTons,
    maxTons,
    yieldPerAcre,
    benchmarkYieldPerAcre: profile.benchmarkTonsPerAcre,
    yieldVsBenchmarkPct,
    confidence,
    marketPricePerTon: profile.marketPricePerTon,
    priceVolatilityPct: profile.priceVolatilityPct,
    grossRevenueMin,
    grossRevenueMax,
    productionCostPerAcre: profile.productionCostPerAcre,
    estimatedProductionCost,
    netRevenueMin,
    netRevenueMax,
    harvestWindowDays,
    marketSource: profile.marketSource,
    marketAsOf: profile.marketAsOf,
  };

  const farmIntel = await persistFarmIntelEvent({
    eventType: "yield",
    entityKey: `${crop}:${district.toLowerCase()}:${acres}`,
    sourceLayer: "intelligence",
    cropType: crop,
    district,
    confidencePct: confidence,
    recommendationLabel: `${minTons}-${maxTons} tons forecast`,
    acres,
    grossRevenueRs: grossRevenueMax,
    seasonTag: "current_market_window",
    sourceMode: "yield_model_v2_market_calibrated",
    payload,
  });

  return NextResponse.json({
    ...payload,
    farmIntel,
  });
}
