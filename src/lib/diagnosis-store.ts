import "server-only";

import { generateImpact, type ImpactInput } from "@/lib/impact";
import type { DiagnosisRecord } from "@/lib/diagnosis-types";

type DiagnosisRecordInput = ImpactInput & {
  source: "vision" | "reasoning" | "fallback";
  model: string;
  locale: "en-IN" | "hi-IN";
  imageFingerprint: string;
};

const DEFAULT_LIMIT = 6;

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) return null;

  return {
    url: url.replace(/\/+$/, ""),
    serviceRoleKey,
  };
}

function mapRecord(input: DiagnosisRecordInput): DiagnosisRecord {
  const impact = generateImpact(input);

  return {
    disease: input.disease,
    confidence: input.confidence,
    treatment: input.treatment,
    cost: input.cost,
    source: input.source,
    model: input.model,
    locale: input.locale,
    imageFingerprint: input.imageFingerprint,
    yieldIncrease: impact.yieldIncrease,
    costSaved: impact.costSaved,
    riskReduction: impact.riskReduction,
    decisionConfidence: impact.decisionConfidence,
  };
}

function normalizeHistoryRecord(value: unknown): DiagnosisRecord | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;

  const disease = typeof record.disease === "string" ? record.disease : "";
  const confidence = typeof record.confidence === "string" ? record.confidence : "";
  const treatment = typeof record.treatment === "string" ? record.treatment : "";
  const cost = typeof record.cost === "string" ? record.cost : "";
  const source =
    record.source === "vision" || record.source === "reasoning" || record.source === "fallback"
      ? record.source
      : null;
  const model = typeof record.model === "string" ? record.model : "";
  const locale = record.locale === "hi-IN" || record.locale === "en-IN" ? record.locale : "en-IN";
  const imageFingerprint = typeof record.image_fingerprint === "string"
    ? record.image_fingerprint
    : typeof record.imageFingerprint === "string"
      ? record.imageFingerprint
      : "";
  const yieldIncrease = typeof record.yield_increase === "string"
    ? record.yield_increase
    : typeof record.yieldIncrease === "string"
      ? record.yieldIncrease
      : "";
  const costSaved = typeof record.cost_saved === "string"
    ? record.cost_saved
    : typeof record.costSaved === "string"
      ? record.costSaved
      : "";
  const riskReduction = typeof record.risk_reduction === "string"
    ? record.risk_reduction
    : typeof record.riskReduction === "string"
      ? record.riskReduction
      : "";
  const decisionConfidence = typeof record.decision_confidence === "string"
    ? record.decision_confidence
    : typeof record.decisionConfidence === "string"
      ? record.decisionConfidence
      : "";
  const createdAt = typeof record.created_at === "string"
    ? record.created_at
    : typeof record.createdAt === "string"
      ? record.createdAt
      : undefined;
  const id = typeof record.id === "string" ? record.id : undefined;

  if (!disease || !confidence || !treatment || !cost || !source || !model || !imageFingerprint) {
    return null;
  }

  return {
    id,
    disease,
    confidence,
    treatment,
    cost,
    source,
    model,
    locale,
    imageFingerprint,
    yieldIncrease,
    costSaved,
    riskReduction,
    decisionConfidence,
    createdAt,
  };
}

export function isStorageConfigured() {
  return Boolean(getSupabaseConfig());
}

export async function saveDiagnosisRecord(input: DiagnosisRecordInput) {
  const config = getSupabaseConfig();
  if (!config) {
    return { ok: false as const, provider: "none" as const };
  }

  const record = mapRecord(input);

  const response = await fetch(`${config.url}/rest/v1/diagnoses`, {
    method: "POST",
    headers: {
      apikey: config.serviceRoleKey,
      authorization: `Bearer ${config.serviceRoleKey}`,
      "content-type": "application/json",
      prefer: "return=minimal",
    },
    body: JSON.stringify({
      disease: record.disease,
      confidence: record.confidence,
      treatment: record.treatment,
      cost: record.cost,
      source: record.source,
      model: record.model,
      locale: record.locale,
      image_fingerprint: record.imageFingerprint,
      yield_increase: record.yieldIncrease,
      cost_saved: record.costSaved,
      risk_reduction: record.riskReduction,
      decision_confidence: record.decisionConfidence,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return {
      ok: false as const,
      provider: "supabase" as const,
      status: response.status,
    };
  }

  return {
    ok: true as const,
    provider: "supabase" as const,
  };
}

export async function listDiagnosisRecords(limit = DEFAULT_LIMIT): Promise<DiagnosisRecord[]> {
  const config = getSupabaseConfig();
  if (!config) {
    return [];
  }

  const safeLimit = Math.min(Math.max(limit, 1), 12);
  const query = new URLSearchParams({
    select:
      "id,disease,confidence,treatment,cost,source,model,locale,image_fingerprint,yield_increase,cost_saved,risk_reduction,decision_confidence,created_at",
    order: "created_at.desc",
    limit: String(safeLimit),
  });

  const response = await fetch(`${config.url}/rest/v1/diagnoses?${query.toString()}`, {
    method: "GET",
    headers: {
      apikey: config.serviceRoleKey,
      authorization: `Bearer ${config.serviceRoleKey}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as unknown[];
  return payload
    .map((item) => normalizeHistoryRecord(item))
    .filter((item): item is DiagnosisRecord => Boolean(item));
}
