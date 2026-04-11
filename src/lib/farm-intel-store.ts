import "server-only";

import { createHash, randomUUID } from "node:crypto";

type SupabaseConfig = {
  url: string;
  serviceRoleKey: string;
};

type FarmIntelEventType = "diagnosis" | "yield" | "irrigation" | "agri_score";

export type FarmIntelEventRecord = {
  id?: string;
  eventType: FarmIntelEventType;
  entityKey: string;
  payload: unknown;
  payloadHash: string;
  sourceLayer?: string | null;
  cropType?: string | null;
  district?: string | null;
  locale?: string | null;
  diagnosisLabel?: string | null;
  confidencePct?: number | null;
  scoreValue?: number | null;
  riskLevel?: string | null;
  recommendationLabel?: string | null;
  acres?: number | null;
  grossRevenueRs?: number | null;
  seasonTag?: string | null;
  sourceMode?: string | null;
  walletAddress?: string | null;
  txHash?: string | null;
  createdAt?: string;
};

export type LedgerRecord = {
  id?: string;
  eventType: FarmIntelEventType;
  entityKey: string;
  blockHash: string;
  previousBlockHash: string;
  payloadHash: string;
  height: number;
  createdAt?: string;
};

type PersistEventInput = {
  eventType: FarmIntelEventType;
  entityKey: string;
  payload: unknown;
  anchorToLedger?: boolean;
  sourceLayer?: string | null;
  cropType?: string | null;
  district?: string | null;
  locale?: string | null;
  diagnosisLabel?: string | null;
  confidencePct?: number | null;
  scoreValue?: number | null;
  riskLevel?: string | null;
  recommendationLabel?: string | null;
  acres?: number | null;
  grossRevenueRs?: number | null;
  seasonTag?: string | null;
  sourceMode?: string | null;
  walletAddress?: string | null;
  txHash?: string | null;
};

async function supabaseFetch(url: string, init: RequestInit) {
  const response = await fetch(url, { ...init, cache: "no-store" });
  if (response.ok || init.method === "GET") return response;

  return fetch(url, { ...init, cache: "no-store" });
}

async function insertFarmIntelEvent(config: SupabaseConfig, row: Record<string, unknown>) {
  return supabaseFetch(`${config.url}/rest/v1/farm_intel_events`, {
    method: "POST",
    headers: {
      ...headers(config),
      prefer: "return=minimal",
    },
    body: JSON.stringify(row),
    cache: "no-store",
  });
}

function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) return null;

  return {
    url: url.replace(/\/+$/, ""),
    serviceRoleKey,
  };
}

function headers(config: SupabaseConfig) {
  return {
    apikey: config.serviceRoleKey,
    authorization: `Bearer ${config.serviceRoleKey}`,
    "content-type": "application/json",
  };
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(object[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function fetchLatestBlock(config: SupabaseConfig): Promise<LedgerRecord | null> {
  const query = new URLSearchParams({
    select: "id,event_type,entity_key,block_hash,previous_block_hash,payload_hash,height,created_at",
    order: "height.desc",
    limit: "1",
  });

  const response = await fetch(`${config.url}/rest/v1/agri_ledger_blocks?${query.toString()}`, {
    method: "GET",
    headers: headers(config),
    cache: "no-store",
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as Array<Record<string, unknown>>;
  const row = payload[0];
  if (!row) return null;

  return {
    id: typeof row.id === "string" ? row.id : undefined,
    eventType:
      row.event_type === "diagnosis" ||
      row.event_type === "yield" ||
      row.event_type === "irrigation" ||
      row.event_type === "agri_score"
        ? row.event_type
        : "diagnosis",
    entityKey:
      typeof row.entity_key === "string"
        ? row.entity_key
        : typeof row.entityKey === "string"
          ? row.entityKey
          : "unknown",
    blockHash:
      typeof row.block_hash === "string"
        ? row.block_hash
        : typeof row.blockHash === "string"
          ? row.blockHash
          : "",
    previousBlockHash:
      typeof row.previous_block_hash === "string"
        ? row.previous_block_hash
        : typeof row.previousBlockHash === "string"
          ? row.previousBlockHash
          : "GENESIS",
    payloadHash:
      typeof row.payload_hash === "string"
        ? row.payload_hash
        : typeof row.payloadHash === "string"
          ? row.payloadHash
          : "",
    height: typeof row.height === "number" ? row.height : 0,
    createdAt:
      typeof row.created_at === "string"
        ? row.created_at
        : typeof row.createdAt === "string"
          ? row.createdAt
          : undefined,
  };
}

export function isFarmIntelStorageConfigured() {
  return Boolean(getSupabaseConfig());
}

export function getFarmIntelStorageHealth() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return {
    hasSupabaseUrl: Boolean(url),
    hasServiceRoleKey: Boolean(serviceRoleKey),
    urlHost: url ? new URL(url).host : null,
    serviceRoleKeyPrefix: serviceRoleKey ? serviceRoleKey.slice(0, 10) : null,
  };
}

export async function persistFarmIntelEvent(input: PersistEventInput) {
  const config = getSupabaseConfig();
  if (!config) {
    return { ok: false as const, provider: "none" as const };
  }

  const timestamp = new Date().toISOString();
  const payloadJson = stableStringify(input.payload);
  const payloadHash = sha256(payloadJson);
  const eventId = randomUUID();
  const eventRow = {
    id: eventId,
    event_type: input.eventType,
    entity_key: input.entityKey,
    payload: input.payload,
    payload_hash: payloadHash,
    source_layer: input.sourceLayer ?? null,
    crop_type: input.cropType ?? null,
    district: input.district ?? null,
    locale: input.locale ?? null,
    diagnosis_label: input.diagnosisLabel ?? null,
    confidence_pct: input.confidencePct ?? null,
    score_value: input.scoreValue ?? null,
    risk_level: input.riskLevel ?? null,
    recommendation_label: input.recommendationLabel ?? null,
    acres: input.acres ?? null,
    gross_revenue_rs: input.grossRevenueRs ?? null,
    season_tag: input.seasonTag ?? null,
    source_mode: input.sourceMode ?? null,
    wallet_address: input.walletAddress ?? null,
    tx_hash: input.txHash ?? null,
    created_at: timestamp,
  };
  let eventResponse = await insertFarmIntelEvent(config, eventRow);

  if (!eventResponse.ok) {
    eventResponse = await insertFarmIntelEvent(config, {
      id: eventId,
      event_type: input.eventType,
      entity_key: input.entityKey,
      payload: input.payload,
      payload_hash: payloadHash,
      created_at: timestamp,
    });
  }

  if (!eventResponse.ok) {
    return {
      ok: false as const,
      provider: "supabase" as const,
      eventId,
      eventStatus: eventResponse.status,
    };
  }

  if (!input.anchorToLedger) {
    return {
      ok: true as const,
      provider: "supabase" as const,
      eventId,
      payloadHash,
    };
  }

  const latestBlock = await fetchLatestBlock(config);
  const previousBlockHash = latestBlock?.blockHash || "GENESIS";
  const height = (latestBlock?.height || 0) + 1;
  const blockHash = sha256(
    stableStringify({
      previousBlockHash,
      payloadHash,
      eventType: input.eventType,
      entityKey: input.entityKey,
      height,
      timestamp,
    }),
  );

  const ledgerRow = {
    id: randomUUID(),
    event_id: eventId,
    event_type: input.eventType,
    entity_key: input.entityKey,
    payload_hash: payloadHash,
    previous_block_hash: previousBlockHash,
    block_hash: blockHash,
    height,
    created_at: timestamp,
  };

  const ledgerResponse = await supabaseFetch(`${config.url}/rest/v1/agri_ledger_blocks`, {
    method: "POST",
    headers: {
      ...headers(config),
      prefer: "return=minimal",
    },
    body: JSON.stringify(ledgerRow),
    cache: "no-store",
  });

  if (!ledgerResponse.ok) {
    return {
      ok: false as const,
      provider: "supabase" as const,
      eventId,
      eventStatus: eventResponse.status,
      ledgerStatus: ledgerResponse.status,
    };
  }

  return {
    ok: true as const,
    provider: "supabase" as const,
    eventId,
    payloadHash,
    blockHash,
    height,
  };
}

function normalizeEventType(value: unknown): FarmIntelEventType {
  return value === "diagnosis" || value === "yield" || value === "irrigation" || value === "agri_score"
    ? value
    : "diagnosis";
}

function normalizeEventRow(row: Record<string, unknown>): FarmIntelEventRecord {
  return {
    id: typeof row.id === "string" ? row.id : undefined,
    eventType: normalizeEventType(row.event_type ?? row.eventType),
    entityKey:
      typeof row.entity_key === "string"
        ? row.entity_key
        : typeof row.entityKey === "string"
          ? row.entityKey
          : "unknown",
    payload: row.payload ?? null,
    payloadHash:
      typeof row.payload_hash === "string"
        ? row.payload_hash
        : typeof row.payloadHash === "string"
          ? row.payloadHash
          : "",
    sourceLayer:
      typeof row.source_layer === "string" ? row.source_layer : typeof row.sourceLayer === "string" ? row.sourceLayer : null,
    cropType:
      typeof row.crop_type === "string" ? row.crop_type : typeof row.cropType === "string" ? row.cropType : null,
    district: typeof row.district === "string" ? row.district : null,
    locale: row.locale === "en-IN" || row.locale === "hi-IN" ? row.locale : null,
    diagnosisLabel:
      typeof row.diagnosis_label === "string"
        ? row.diagnosis_label
        : typeof row.diagnosisLabel === "string"
          ? row.diagnosisLabel
          : null,
    confidencePct:
      typeof row.confidence_pct === "number"
        ? row.confidence_pct
        : typeof row.confidencePct === "number"
          ? row.confidencePct
          : null,
    scoreValue:
      typeof row.score_value === "number" ? row.score_value : typeof row.scoreValue === "number" ? row.scoreValue : null,
    riskLevel:
      typeof row.risk_level === "string" ? row.risk_level : typeof row.riskLevel === "string" ? row.riskLevel : null,
    recommendationLabel:
      typeof row.recommendation_label === "string"
        ? row.recommendation_label
        : typeof row.recommendationLabel === "string"
          ? row.recommendationLabel
          : null,
    acres: typeof row.acres === "number" ? row.acres : null,
    grossRevenueRs:
      typeof row.gross_revenue_rs === "number"
        ? row.gross_revenue_rs
        : typeof row.grossRevenueRs === "number"
          ? row.grossRevenueRs
          : null,
    seasonTag:
      typeof row.season_tag === "string" ? row.season_tag : typeof row.seasonTag === "string" ? row.seasonTag : null,
    sourceMode:
      typeof row.source_mode === "string" ? row.source_mode : typeof row.sourceMode === "string" ? row.sourceMode : null,
    walletAddress:
      typeof row.wallet_address === "string"
        ? row.wallet_address
        : typeof row.walletAddress === "string"
          ? row.walletAddress
          : null,
    txHash:
      typeof row.tx_hash === "string" ? row.tx_hash : typeof row.txHash === "string" ? row.txHash : null,
    createdAt:
      typeof row.created_at === "string"
        ? row.created_at
        : typeof row.createdAt === "string"
          ? row.createdAt
          : undefined,
  };
}

export async function listFarmIntelEvents(limit = 12, eventType?: FarmIntelEventType): Promise<FarmIntelEventRecord[]> {
  const config = getSupabaseConfig();
  if (!config) return [];

  const query = new URLSearchParams({
    select:
      "id,event_type,entity_key,payload,payload_hash,source_layer,crop_type,district,locale,diagnosis_label,confidence_pct,score_value,risk_level,recommendation_label,acres,gross_revenue_rs,season_tag,source_mode,wallet_address,tx_hash,created_at",
    order: "created_at.desc",
    limit: String(Math.min(Math.max(limit, 1), 50)),
  });

  if (eventType) {
    query.set("event_type", `eq.${eventType}`);
  }

  let response = await supabaseFetch(`${config.url}/rest/v1/farm_intel_events?${query.toString()}`, {
    method: "GET",
    headers: headers(config),
  });

  if (!response.ok) {
    const fallbackQuery = new URLSearchParams({
      select: "id,event_type,entity_key,payload,payload_hash,created_at",
      order: "created_at.desc",
      limit: String(Math.min(Math.max(limit, 1), 50)),
    });

    if (eventType) {
      fallbackQuery.set("event_type", `eq.${eventType}`);
    }

    response = await supabaseFetch(`${config.url}/rest/v1/farm_intel_events?${fallbackQuery.toString()}`, {
      method: "GET",
      headers: headers(config),
    });
  }

  if (!response.ok) return [];

  const payload = (await response.json()) as Array<Record<string, unknown>>;
  return payload.map((row) => normalizeEventRow(row));
}

export async function listLedgerRecords(limit = 10): Promise<LedgerRecord[]> {
  const config = getSupabaseConfig();
  if (!config) return [];

  const query = new URLSearchParams({
    select: "id,event_type,entity_key,block_hash,previous_block_hash,payload_hash,height,created_at",
    order: "height.desc",
    limit: String(Math.min(Math.max(limit, 1), 20)),
  });

  const response = await fetch(`${config.url}/rest/v1/agri_ledger_blocks?${query.toString()}`, {
    method: "GET",
    headers: headers(config),
    cache: "no-store",
  });

  if (!response.ok) return [];

  const payload = (await response.json()) as Array<Record<string, unknown>>;
  return payload.map((row) => ({
    id: typeof row.id === "string" ? row.id : undefined,
    eventType:
      row.event_type === "diagnosis" ||
      row.event_type === "yield" ||
      row.event_type === "irrigation" ||
      row.event_type === "agri_score"
        ? row.event_type
        : "diagnosis",
    entityKey:
      typeof row.entity_key === "string"
        ? row.entity_key
        : typeof row.entityKey === "string"
          ? row.entityKey
          : "unknown",
    blockHash:
      typeof row.block_hash === "string"
        ? row.block_hash
        : typeof row.blockHash === "string"
          ? row.blockHash
          : "",
    previousBlockHash:
      typeof row.previous_block_hash === "string"
        ? row.previous_block_hash
        : typeof row.previousBlockHash === "string"
          ? row.previousBlockHash
          : "GENESIS",
    payloadHash:
      typeof row.payload_hash === "string"
        ? row.payload_hash
        : typeof row.payloadHash === "string"
          ? row.payloadHash
          : "",
    height: typeof row.height === "number" ? row.height : 0,
    createdAt:
      typeof row.created_at === "string"
        ? row.created_at
        : typeof row.createdAt === "string"
          ? row.createdAt
          : undefined,
  }));
}
