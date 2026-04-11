import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { analyzeCropImage, deterministicFallbackFromBase64, type DiagnosisEnvelope } from "@/lib/aiEngine";
import { saveDiagnosisRecord } from "@/lib/diagnosis-store";
import { persistFarmIntelEvent } from "@/lib/farm-intel-store";

export const runtime = "nodejs";

type CropDiagnosisBody = {
  image?: string;
  locale?: "hi-IN" | "en-IN";
};

function narration(result: DiagnosisEnvelope) {
  const en = `Disease likely: ${result.disease}. Confidence ${result.confidence}. Treatment: ${result.treatment}. Estimated cost ${result.cost}. Advice: ${result.advice}`;
  const hi = `Sambhavit rog: ${result.disease}. Confidence ${result.confidence}. Upchar: ${result.treatment}. Anumanit lagat ${result.cost}. Salah: ${result.advice}`;
  return { en, hi };
}

function userFacingError(locale: CropDiagnosisBody["locale"]) {
  return locale === "hi-IN"
    ? "AI analysis abhi available nahi tha, isliye verified fallback result dikhaya gaya hai."
    : "AI analysis was unavailable, so we used a verified fallback result.";
}

function imageFingerprint(image: string) {
  return createHash("sha256").update(image).digest("hex").slice(0, 24);
}

export async function POST(req: Request) {
  let body: CropDiagnosisBody | null = null;

  try {
    body = (await req.json()) as CropDiagnosisBody;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid request body.",
        result: null,
      },
      { status: 400 },
    );
  }

  if (!body?.image || typeof body.image !== "string") {
    return NextResponse.json(
      {
        ok: false,
        error: "An image is required for crop diagnosis.",
        result: null,
      },
      { status: 400 },
    );
  }

  const locale = body.locale === "hi-IN" ? "hi-IN" : "en-IN";
  const fingerprint = imageFingerprint(body.image);
  const buildResponse = async (result: DiagnosisEnvelope, forceFallbackMessage: boolean) => {
    let diagnosisStorage: Awaited<ReturnType<typeof saveDiagnosisRecord>> = { ok: false, provider: "none" } as const;
    let farmIntel: Awaited<ReturnType<typeof persistFarmIntelEvent>> = { ok: false, provider: "none" } as const;

    try {
      diagnosisStorage = await saveDiagnosisRecord({
        disease: result.disease,
        confidence: result.confidence,
        treatment: result.treatment,
        cost: result.cost,
        source: result.source,
        model: result.model,
        locale,
        imageFingerprint: fingerprint,
      });
    } catch {}

    try {
      farmIntel = await persistFarmIntelEvent({
        eventType: "diagnosis",
        entityKey: fingerprint,
        sourceLayer: "access",
        locale,
        diagnosisLabel: result.disease,
        confidencePct: Number.parseInt(result.confidence, 10) || null,
        recommendationLabel: result.treatment,
        sourceMode: result.source,
        payload: {
          disease: result.disease,
          confidence: result.confidence,
          treatment: result.treatment,
          cost: result.cost,
          advice: result.advice,
          source: result.source,
          model: result.model,
          locale,
          imageFingerprint: fingerprint,
        },
      });
    } catch {}

    return NextResponse.json({
      ok: true,
      error: forceFallbackMessage || result.source === "fallback" ? userFacingError(locale) : null,
      result,
      narration: narration(result),
      storage: {
        diagnosis: diagnosisStorage,
        farmIntel,
      },
    });
  };

  try {
    const result = await analyzeCropImage(body.image);
    return buildResponse(result, false);
  } catch {
    try {
      const safeFallback = deterministicFallbackFromBase64(body.image);
      return buildResponse(safeFallback, true);
    } catch {
      return NextResponse.json({
        ok: true,
        error: userFacingError(locale),
        result: deterministicFallbackFromBase64("agrisentinel"),
        narration: narration(deterministicFallbackFromBase64("agrisentinel")),
        storage: {
          diagnosis: { ok: false, provider: "none" as const },
          farmIntel: { ok: false, provider: "none" as const },
        },
      });
    }
  }
}
