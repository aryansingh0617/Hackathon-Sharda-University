import { NextResponse } from "next/server";
import { calculateAgriScore } from "@/lib/agri-score";
import { persistFarmIntelEvent } from "@/lib/farm-intel-store";

export const runtime = "nodejs";

type Body = {
  yieldSignal?: {
    acres?: number;
    yieldPerAcre?: number;
    confidence?: number;
    diseasePressure?: number;
    grossRevenueMax?: number;
  };
  irrigationSignal?: {
    urgency?: string;
    moistureGap?: number;
    evapStressIndex?: number;
    rainfallOffset?: number;
  };
  diagnosisSignal?: {
    disease?: string;
    confidence?: string;
    source?: "vision" | "reasoning" | "fallback";
  } | null;
  historyCount?: number;
};

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {}

  const payload = calculateAgriScore(body);

  const farmIntel = await persistFarmIntelEvent({
    eventType: "agri_score",
    entityKey: body.diagnosisSignal?.disease ?? "farm-score",
    anchorToLedger: true,
    sourceLayer: "finance",
    diagnosisLabel: body.diagnosisSignal?.disease ?? null,
    confidencePct: body.diagnosisSignal?.confidence ? Number.parseInt(body.diagnosisSignal.confidence, 10) || null : null,
    scoreValue: payload.score,
    riskLevel: payload.risk,
    recommendationLabel: payload.rating,
    acres: typeof body.yieldSignal?.acres === "number" ? body.yieldSignal.acres : null,
    grossRevenueRs:
      typeof body.yieldSignal?.grossRevenueMax === "number" ? body.yieldSignal.grossRevenueMax : null,
    sourceMode: body.diagnosisSignal?.source ?? "score_model_v1",
    payload: {
      ...payload,
      diagnosisSignal: body.diagnosisSignal ?? null,
      historyCount: body.historyCount ?? 0,
    },
  });

  return NextResponse.json({
    ...payload,
    farmIntel,
  });
}
