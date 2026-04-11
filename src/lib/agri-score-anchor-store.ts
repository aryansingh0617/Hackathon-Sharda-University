import "server-only";

type AnchorRecord = {
  id?: string;
  walletAddress: string;
  score: number;
  scoreHash: string;
  txHash: string;
  chainId: number;
  diagnosisLabel?: string | null;
  annualIncomeRs?: number | null;
  loanAmountRs?: number | null;
  debtToIncomeRatio?: number | null;
  inputCostEfficiencyPct?: number | null;
  pastLoanRepayment?: string | null;
  stateAvgDebtRs?: number | null;
  soilHealthIndex?: number | null;
  soilMoisturePct?: number | null;
  yieldVsBenchmarkPct?: number | null;
  yieldKgPerHa?: number | null;
  seasonConsistencyYears?: number | null;
  cropInsurance?: boolean | null;
  irrigationAccessEnc?: string | null;
  farmingExperienceYears?: number | null;
  createdAt?: string;
};

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) return null;

  return {
    url: url.replace(/\/+$/, ""),
    serviceRoleKey,
  };
}

function headers(config: { serviceRoleKey: string }) {
  return {
    apikey: config.serviceRoleKey,
    authorization: `Bearer ${config.serviceRoleKey}`,
    "content-type": "application/json",
  };
}

async function insertAnchorRow(config: NonNullable<ReturnType<typeof getSupabaseConfig>>, row: Record<string, unknown>) {
  return fetch(`${config.url}/rest/v1/agri_score_anchors`, {
    method: "POST",
    headers: {
      ...headers(config),
      prefer: "return=minimal",
    },
    body: JSON.stringify(row),
    cache: "no-store",
  });
}

export function isAgriScoreAnchorStorageConfigured() {
  return Boolean(getSupabaseConfig());
}

export async function saveAgriScoreAnchor(input: {
  walletAddress: string;
  score: number;
  scoreHash: string;
  txHash: string;
  chainId: number;
  diagnosisLabel?: string | null;
  annualIncomeRs?: number | null;
  loanAmountRs?: number | null;
  debtToIncomeRatio?: number | null;
  inputCostEfficiencyPct?: number | null;
  pastLoanRepayment?: string | null;
  stateAvgDebtRs?: number | null;
  soilHealthIndex?: number | null;
  soilMoisturePct?: number | null;
  yieldVsBenchmarkPct?: number | null;
  yieldKgPerHa?: number | null;
  seasonConsistencyYears?: number | null;
  cropInsurance?: boolean | null;
  irrigationAccessEnc?: string | null;
  farmingExperienceYears?: number | null;
}) {
  const config = getSupabaseConfig();
  if (!config) return { ok: false as const, provider: "none" as const };

  let response = await insertAnchorRow(config, {
    wallet_address: input.walletAddress,
    score: input.score,
    score_hash: input.scoreHash,
    tx_hash: input.txHash,
    chain_id: input.chainId,
    diagnosis_label: input.diagnosisLabel ?? null,
    annual_income_rs: input.annualIncomeRs ?? null,
    loan_amount_rs: input.loanAmountRs ?? null,
    debt_to_income_ratio: input.debtToIncomeRatio ?? null,
    input_cost_efficiency_pct: input.inputCostEfficiencyPct ?? null,
    past_loan_repayment: input.pastLoanRepayment ?? null,
    state_avg_debt_rs: input.stateAvgDebtRs ?? null,
    soil_health_index: input.soilHealthIndex ?? null,
    soil_moisture_pct: input.soilMoisturePct ?? null,
    yield_vs_benchmark_pct: input.yieldVsBenchmarkPct ?? null,
    yield_kg_per_ha: input.yieldKgPerHa ?? null,
    season_consistency_years: input.seasonConsistencyYears ?? null,
    crop_insurance: input.cropInsurance ?? null,
    irrigation_access_enc: input.irrigationAccessEnc ?? null,
    farming_experience_years: input.farmingExperienceYears ?? null,
  });

  if (!response.ok) {
    response = await insertAnchorRow(config, {
      wallet_address: input.walletAddress,
      score: input.score,
      score_hash: input.scoreHash,
      tx_hash: input.txHash,
      chain_id: input.chainId,
      diagnosis_label: input.diagnosisLabel ?? null,
    });
  }

  if (!response.ok) {
    return { ok: false as const, provider: "supabase" as const, status: response.status };
  }

  return { ok: true as const, provider: "supabase" as const };
}

export async function listAgriScoreAnchors(limit = 8): Promise<AnchorRecord[]> {
  const config = getSupabaseConfig();
  if (!config) return [];

  const query = new URLSearchParams({
    select:
      "id,wallet_address,score,score_hash,tx_hash,chain_id,diagnosis_label,annual_income_rs,loan_amount_rs,debt_to_income_ratio,input_cost_efficiency_pct,past_loan_repayment,state_avg_debt_rs,soil_health_index,soil_moisture_pct,yield_vs_benchmark_pct,yield_kg_per_ha,season_consistency_years,crop_insurance,irrigation_access_enc,farming_experience_years,created_at",
    order: "created_at.desc",
    limit: String(Math.min(Math.max(limit, 1), 20)),
  });

  let response = await fetch(`${config.url}/rest/v1/agri_score_anchors?${query.toString()}`, {
    method: "GET",
    headers: headers(config),
    cache: "no-store",
  });

  if (!response.ok) {
    const fallbackQuery = new URLSearchParams({
      select: "id,wallet_address,score,score_hash,tx_hash,chain_id,diagnosis_label,created_at",
      order: "created_at.desc",
      limit: String(Math.min(Math.max(limit, 1), 20)),
    });

    response = await fetch(`${config.url}/rest/v1/agri_score_anchors?${fallbackQuery.toString()}`, {
      method: "GET",
      headers: headers(config),
      cache: "no-store",
    });
  }

  if (!response.ok) return [];

  const payload = (await response.json()) as Array<Record<string, unknown>>;
  return payload.map((row) => ({
    id: typeof row.id === "string" ? row.id : undefined,
    walletAddress:
      typeof row.wallet_address === "string"
        ? row.wallet_address
        : typeof row.walletAddress === "string"
          ? row.walletAddress
          : "",
    score: typeof row.score === "number" ? row.score : 0,
    scoreHash:
      typeof row.score_hash === "string"
        ? row.score_hash
        : typeof row.scoreHash === "string"
          ? row.scoreHash
          : "",
    txHash:
      typeof row.tx_hash === "string"
        ? row.tx_hash
        : typeof row.txHash === "string"
          ? row.txHash
          : "",
    chainId:
      typeof row.chain_id === "number"
        ? row.chain_id
        : typeof row.chainId === "number"
          ? row.chainId
          : 84532,
    diagnosisLabel:
      typeof row.diagnosis_label === "string"
        ? row.diagnosis_label
        : typeof row.diagnosisLabel === "string"
          ? row.diagnosisLabel
          : null,
    annualIncomeRs: typeof row.annual_income_rs === "number" ? row.annual_income_rs : null,
    loanAmountRs: typeof row.loan_amount_rs === "number" ? row.loan_amount_rs : null,
    debtToIncomeRatio:
      typeof row.debt_to_income_ratio === "number" ? row.debt_to_income_ratio : null,
    inputCostEfficiencyPct:
      typeof row.input_cost_efficiency_pct === "number" ? row.input_cost_efficiency_pct : null,
    pastLoanRepayment:
      typeof row.past_loan_repayment === "string" ? row.past_loan_repayment : null,
    stateAvgDebtRs: typeof row.state_avg_debt_rs === "number" ? row.state_avg_debt_rs : null,
    soilHealthIndex: typeof row.soil_health_index === "number" ? row.soil_health_index : null,
    soilMoisturePct: typeof row.soil_moisture_pct === "number" ? row.soil_moisture_pct : null,
    yieldVsBenchmarkPct:
      typeof row.yield_vs_benchmark_pct === "number" ? row.yield_vs_benchmark_pct : null,
    yieldKgPerHa: typeof row.yield_kg_per_ha === "number" ? row.yield_kg_per_ha : null,
    seasonConsistencyYears:
      typeof row.season_consistency_years === "number" ? row.season_consistency_years : null,
    cropInsurance: typeof row.crop_insurance === "boolean" ? row.crop_insurance : null,
    irrigationAccessEnc:
      typeof row.irrigation_access_enc === "string" ? row.irrigation_access_enc : null,
    farmingExperienceYears:
      typeof row.farming_experience_years === "number" ? row.farming_experience_years : null,
    createdAt:
      typeof row.created_at === "string"
        ? row.created_at
        : typeof row.createdAt === "string"
          ? row.createdAt
          : undefined,
  }));
}
