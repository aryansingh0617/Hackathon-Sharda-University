import { NextResponse } from "next/server";
import {
  isAgriScoreAnchorStorageConfigured,
  listAgriScoreAnchors,
  saveAgriScoreAnchor,
} from "@/lib/agri-score-anchor-store";

export const runtime = "nodejs";

type AnchorBody = {
  walletAddress?: string;
  score?: number;
  scoreHash?: string;
  txHash?: string;
  chainId?: number;
  diagnosisLabel?: string | null;
  annualIncomeRs?: number;
  loanAmountRs?: number;
  debtToIncomeRatio?: number;
  inputCostEfficiencyPct?: number;
  pastLoanRepayment?: string | null;
  stateAvgDebtRs?: number;
  soilHealthIndex?: number;
  soilMoisturePct?: number;
  yieldVsBenchmarkPct?: number;
  yieldKgPerHa?: number;
  seasonConsistencyYears?: number;
  cropInsurance?: boolean;
  irrigationAccessEnc?: string | null;
  farmingExperienceYears?: number;
};

export async function GET() {
  try {
    const anchors = await listAgriScoreAnchors(10);
    return NextResponse.json({
      ok: true,
      anchors,
      storageEnabled: isAgriScoreAnchorStorageConfigured(),
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        anchors: [],
        storageEnabled: isAgriScoreAnchorStorageConfigured(),
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  let body: AnchorBody = {};
  try {
    body = (await req.json()) as AnchorBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  if (!body.walletAddress || !body.scoreHash || !body.txHash || typeof body.score !== "number") {
    return NextResponse.json({ ok: false, error: "Missing anchor fields." }, { status: 400 });
  }

  const result = await saveAgriScoreAnchor({
    walletAddress: body.walletAddress,
    score: body.score,
    scoreHash: body.scoreHash,
    txHash: body.txHash,
    chainId: body.chainId ?? 84532,
    diagnosisLabel: body.diagnosisLabel ?? null,
    annualIncomeRs: typeof body.annualIncomeRs === "number" ? body.annualIncomeRs : null,
    loanAmountRs: typeof body.loanAmountRs === "number" ? body.loanAmountRs : null,
    debtToIncomeRatio: typeof body.debtToIncomeRatio === "number" ? body.debtToIncomeRatio : null,
    inputCostEfficiencyPct:
      typeof body.inputCostEfficiencyPct === "number" ? body.inputCostEfficiencyPct : null,
    pastLoanRepayment: typeof body.pastLoanRepayment === "string" ? body.pastLoanRepayment : null,
    stateAvgDebtRs: typeof body.stateAvgDebtRs === "number" ? body.stateAvgDebtRs : null,
    soilHealthIndex: typeof body.soilHealthIndex === "number" ? body.soilHealthIndex : null,
    soilMoisturePct: typeof body.soilMoisturePct === "number" ? body.soilMoisturePct : null,
    yieldVsBenchmarkPct: typeof body.yieldVsBenchmarkPct === "number" ? body.yieldVsBenchmarkPct : null,
    yieldKgPerHa: typeof body.yieldKgPerHa === "number" ? body.yieldKgPerHa : null,
    seasonConsistencyYears:
      typeof body.seasonConsistencyYears === "number" ? body.seasonConsistencyYears : null,
    cropInsurance: typeof body.cropInsurance === "boolean" ? body.cropInsurance : null,
    irrigationAccessEnc: typeof body.irrigationAccessEnc === "string" ? body.irrigationAccessEnc : null,
    farmingExperienceYears:
      typeof body.farmingExperienceYears === "number" ? body.farmingExperienceYears : null,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: "Failed to save anchor." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
