"use client";

import { type ComponentType, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Banknote, Landmark, Shield, Sparkles, Waves } from "lucide-react";
import { Section } from "@/components/ui/section";
import { GlassCard } from "@/components/ui/glass-card";
import {
  BASE_SEPOLIA_CHAIN_ID,
  anchorAgriScoreOnChain,
  connectWallet,
  hashAgriScorePayload,
  isBlockchainConfigured,
  waitForTransactionReceipt,
} from "@/lib/agri-score-chain";
import { useLiveDiagnosis } from "@/lib/live-diagnosis-context";

type DiagnosisRecord = {
  disease?: string;
  confidence: string;
  source: "vision" | "reasoning" | "fallback";
};

type YieldSignal = {
  acres: number;
  yieldPerAcre: number;
  confidence: number;
  diseasePressure: number;
  grossRevenueMax: number;
};

type IrrigationSignal = {
  urgency: string;
  moistureGap: number;
  evapStressIndex: number;
  rainfallOffset: number;
};

type AgriScoreData = {
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

type AnchorProfile = {
  annualIncomeRs: number;
  loanAmountRs: number;
  debtToIncomeRatio: number;
  inputCostEfficiencyPct: number;
  pastLoanRepayment: string;
  stateAvgDebtRs: number;
  soilHealthIndex: number;
  soilMoisturePct: number;
  yieldVsBenchmarkPct: number;
  yieldKgPerHa: number;
  seasonConsistencyYears: number;
  cropInsurance: boolean;
  irrigationAccessEnc: string;
  farmingExperienceYears: number;
};

type AnchorMode = "idle" | "connecting" | "anchoring" | "anchored" | "demo" | "error";

const SAMPLE_WALLET_ADDRESS = "0x7e57C0DE71fB31B9eA458b2aF39a3a0F4bA6D201";
const SAMPLE_TX_HASH = "0x4f7a7c62ac34f1d730fef4e2f47a0ae3a0d0de74af03cf41864772ea6d32ac41";

function useCountTo(to: number, ms = 1100) {
  const [v, setV] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let raf = 0;

    const loop = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(eased * to));
      if (p < 1) raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [to, ms]);

  return v;
}

const DEFAULT_SCORE: AgriScoreData = {
  score: 714,
  rating: "B+",
  risk: "Guarded",
  factors: {
    yieldStrength: 121,
    irrigationDiscipline: 109,
    cropHealth: 116,
    revenuePower: 88,
    dataTrust: 80,
  },
};

function deriveDiseasePressure(diagnosis: { disease?: string; confidence?: string } | null) {
  if (!diagnosis?.disease) return 26;

  const disease = diagnosis.disease.toLowerCase();
  const confidence = Number.parseInt(diagnosis.confidence ?? "82", 10) || 82;
  const confidencePressure = Math.round(confidence * 0.22);

  if (disease.includes("late blight")) return Math.min(62, 18 + confidencePressure);
  if (disease.includes("bacterial")) return Math.min(56, 15 + confidencePressure);
  if (disease.includes("leaf curl")) return Math.min(52, 13 + confidencePressure);
  if (disease.includes("early blight")) return Math.min(48, 10 + confidencePressure);
  if (disease.includes("powdery mildew")) return Math.min(44, 8 + confidencePressure);

  return Math.min(46, 10 + confidencePressure);
}

function shortHash(value: string, start = 8, end = 6) {
  if (!value) return "pending";
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

function useScoreHydration(liveDiagnosis: DiagnosisRecord | null) {
  const [scoreData, setScoreData] = useState<AgriScoreData>(DEFAULT_SCORE);

  useEffect(() => {
    let cancelled = false;

    async function hydrateScore() {
      try {
        const diagnosisPressure = deriveDiseasePressure(liveDiagnosis);

        const [yieldRes, irrigationRes, historyRes] = await Promise.all([
          fetch("/api/yield", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              crop: "tomato",
              district: "Nashik",
              acres: 2,
              soilHealth: 74,
              rainfallMm7d: 18,
              diseasePressure: diagnosisPressure,
            }),
          }),
          fetch("/api/irrigation", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              soilMoisture: 0.34,
              forecastMm: 4,
              temperatureC: 33,
              humidity: 56,
              cropStage: "flowering",
            }),
          }),
          fetch("/api/diagnosis-history"),
        ]);

        const yieldSignal = (await yieldRes.json()) as YieldSignal;
        const irrigationSignal = (await irrigationRes.json()) as IrrigationSignal;
        const historyPayload = (await historyRes.json()) as { records?: DiagnosisRecord[] };
        const fallbackDiagnosis = historyPayload.records?.[0] ?? null;
        const diagnosisSignal = liveDiagnosis ?? fallbackDiagnosis;
        const historyCount = historyPayload.records?.length ?? 0;

        const scoreRes = await fetch("/api/agri-score", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            yieldSignal,
            irrigationSignal,
            diagnosisSignal,
            historyCount,
          }),
        });

        if (!scoreRes.ok) {
          throw new Error("Score hydration failed.");
        }

        const nextScore = (await scoreRes.json()) as AgriScoreData;
        if (!cancelled) setScoreData(nextScore);
      } catch {
        if (!cancelled) setScoreData(DEFAULT_SCORE);
      }
    }

    void hydrateScore();

    return () => {
      cancelled = true;
    };
  }, [liveDiagnosis]);

  return scoreData;
}

function buildAnchorProfile(scoreData: AgriScoreData, liveDiagnosis: DiagnosisRecord | null): AnchorProfile {
  const confidence = Number.parseInt(liveDiagnosis?.confidence ?? "84", 10) || 84;
  const annualIncomeRs = Math.round(185000 + scoreData.score * 620);
  const loanAmountRs = Math.round(annualIncomeRs * (0.42 + (scoreData.factors.revenuePower / 1000)));
  const debtToIncomeRatio = Number((loanAmountRs / Math.max(annualIncomeRs, 1)).toFixed(2));
  const inputCostEfficiencyPct = Number(
    Math.min(96, 52 + scoreData.factors.yieldStrength * 0.18 + scoreData.factors.irrigationDiscipline * 0.08).toFixed(
      2,
    ),
  );
  const stateAvgDebtRs = 128000;
  const soilHealthIndex = Number((58 + scoreData.factors.yieldStrength * 0.22).toFixed(2));
  const soilMoisturePct = Number((24 + scoreData.factors.irrigationDiscipline * 0.16).toFixed(2));
  const yieldVsBenchmarkPct = Number((100 + (scoreData.factors.yieldStrength - 100) * 0.78).toFixed(2));
  const yieldKgPerHa = Number((4200 + scoreData.factors.yieldStrength * 28).toFixed(2));
  const seasonConsistencyYears = Math.max(2, Math.round(2 + scoreData.factors.dataTrust / 20));
  const cropInsurance = scoreData.factors.dataTrust >= 72;
  const irrigationAccessEnc =
    scoreData.factors.irrigationDiscipline >= 120 ? "assured_irrigation" : "partial_irrigation";
  const farmingExperienceYears = Math.max(3, Math.round(4 + scoreData.factors.dataTrust / 15));

  return {
    annualIncomeRs,
    loanAmountRs,
    debtToIncomeRatio,
    inputCostEfficiencyPct,
    pastLoanRepayment: confidence >= 88 ? "on_time" : confidence >= 78 ? "minor_delay" : "guarded",
    stateAvgDebtRs,
    soilHealthIndex,
    soilMoisturePct,
    yieldVsBenchmarkPct,
    yieldKgPerHa,
    seasonConsistencyYears,
    cropInsurance,
    irrigationAccessEnc,
    farmingExperienceYears,
  };
}

export function FinancialSystem() {
  const { liveDiagnosis } = useLiveDiagnosis();
  const scoreData = useScoreHydration(liveDiagnosis);
  const score = useCountTo(scoreData.score, 1200);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletInput, setWalletInput] = useState("");
  const [anchorState, setAnchorState] = useState<AnchorMode>("idle");
  const [anchorError, setAnchorError] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  const factorRows = useMemo(
    () => [
      {
        label: "Yield strength",
        value: scoreData.factors.yieldStrength,
        hint: "Acres + district productivity",
      },
      {
        label: "Irrigation discipline",
        value: scoreData.factors.irrigationDiscipline,
        hint: "Moisture response quality",
      },
      {
        label: "Crop health",
        value: scoreData.factors.cropHealth,
        hint: liveDiagnosis ? `Live from ${liveDiagnosis.disease}` : "Latest verified diagnosis",
      },
      {
        label: "Revenue power",
        value: scoreData.factors.revenuePower,
        hint: "Monetization potential",
      },
      {
        label: "Data trust",
        value: scoreData.factors.dataTrust,
        hint: liveDiagnosis ? `Source: ${liveDiagnosis.source}` : "History-backed reliability",
      },
    ],
    [liveDiagnosis, scoreData],
  );

  const txHref = lastTxHash ? `https://sepolia.basescan.org/tx/${lastTxHash}` : null;
  const blockchainLive = isBlockchainConfigured();
  const isSampleWallet = walletAddress === SAMPLE_WALLET_ADDRESS;
  const statusSummary = walletAddress
    ? anchorState === "demo"
      ? isSampleWallet
        ? "Sample wallet loaded for score preview."
        : "Custom wallet loaded for preview."
      : anchorState === "anchored"
        ? "Wallet linked. AgriScore anchored on Base Sepolia."
        : anchorState === "anchoring" || anchorState === "connecting"
          ? "Wallet syncing for blockchain proof."
          : "Wallet linked and ready for live blockchain proof."
    : blockchainLive
      ? "Realtime score is active and ready for live blockchain proof."
      : "Realtime score is active. Sample wallet preview is available.";

  async function handleAnchor() {
    setAnchorError(null);

    try {
      const address = await connectWallet();
      if (!address) {
        throw new Error("Wallet connection was not completed.");
      }

      setWalletAddress(address);
      setAnchorState("connecting");

      const scoreHash = await hashAgriScorePayload({
        score: scoreData.score,
        rating: scoreData.rating,
        risk: scoreData.risk,
        walletAddress: address,
        diagnosis: liveDiagnosis
          ? {
              disease: liveDiagnosis.disease,
              confidence: liveDiagnosis.confidence,
              source: liveDiagnosis.source,
            }
          : null,
      });

      setAnchorState("anchoring");
      const txHash = await anchorAgriScoreOnChain({
        walletAddress: address,
        score: scoreData.score,
        scoreHash,
      });

      setLastTxHash(txHash);
      await waitForTransactionReceipt(txHash);

      const anchorProfile = buildAnchorProfile(scoreData, liveDiagnosis);

      await fetch("/api/agri-score/anchor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          score: scoreData.score,
          scoreHash,
          txHash,
          chainId: BASE_SEPOLIA_CHAIN_ID,
          diagnosisLabel: liveDiagnosis?.disease ?? null,
          ...anchorProfile,
        }),
      });

      setAnchorState("anchored");
    } catch (error) {
      setAnchorState("error");
      setAnchorError(error instanceof Error ? error.message : "Failed to anchor AgriScore on-chain.");
    }
  }

  function useSampleWallet() {
    setAnchorError(null);
    setWalletAddress(SAMPLE_WALLET_ADDRESS);
    setWalletInput(SAMPLE_WALLET_ADDRESS);
    setLastTxHash(SAMPLE_TX_HASH);
    setAnchorState("demo");
  }

  function useManualWallet() {
    const trimmed = walletInput.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
      setAnchorError("Enter a valid EVM wallet address to preview it.");
      return;
    }

    setAnchorError(null);
    setWalletAddress(trimmed);
    setLastTxHash(null);
    setAnchorState("demo");
  }

  return (
    <Section
      id="finance"
      eyebrow="Layer 4 - Financial System"
      title="AgriScore + FarmIntel API"
      subtitle="Financial intelligence from live farm signals. The score updates from Layer 1 in real time and stays grounded in the latest crop-health, irrigation, and revenue signals."
    >
      <div className="grid items-start gap-6 xl:grid-cols-[1.35fr_.95fr]">
        <GlassCard className="overflow-hidden">
          <div className="absolute inset-x-10 top-0 h-28 rounded-full bg-[rgba(0,230,118,.11)] blur-3xl" />
          <div className="relative">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/18 bg-[rgba(0,230,118,.08)] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[var(--accent)]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Live financial readiness
                </div>
                <div className="mt-5 flex items-end gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 240, damping: 22 }}
                    className="text-6xl font-semibold tracking-tight tabular-nums"
                  >
                    {score}
                  </motion.div>
                  <div className="pb-1">
                    <p className="text-sm font-medium text-white">{scoreData.rating} rating</p>
                    <p className="mt-1 text-sm text-white/55">{scoreData.risk} risk profile</p>
                  </div>
                </div>
                <p className="mt-4 max-w-xl text-sm leading-6 text-white/62">
                  The model blends crop health, irrigation behavior, yield strength, revenue power, and trust signals
                  into one lender-friendly readiness score.
                </p>
              </div>

              <div className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/72">
                {statusSummary}
              </div>
            </div>

            {liveDiagnosis ? (
              <div className="mt-5 inline-flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--accent)]/16 bg-[rgba(0,230,118,.08)] px-4 py-3 text-sm text-white/84">
                <span className="text-white/62">Live diagnosis influence</span>
                <span className="rounded-full bg-white/8 px-3 py-1 text-white">{liveDiagnosis.disease}</span>
                <span className="rounded-full bg-white/8 px-3 py-1 text-white">{liveDiagnosis.confidence}</span>
              </div>
            ) : null}

            <div className="mt-6 grid items-start gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,.92fr)]">
              <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02))] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/45">AgriScore breakdown</p>
                    <p className="mt-2 text-sm leading-6 text-white/62">
                      Every update is calculated automatically from the latest farm signals.
                    </p>
                  </div>
                  <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--accent)] shadow-[0_0_18px_rgba(0,230,118,.6)]" />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {factorRows.map((factor, index) => (
                    <FactorCard
                      key={factor.label}
                      label={factor.label}
                      hint={factor.hint}
                      value={factor.value}
                      delay={index * 0.05}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-[var(--accent)]/14 bg-[radial-gradient(circle_at_top,rgba(0,230,118,.14),rgba(0,0,0,.14)_42%,rgba(255,255,255,.03))] p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">Blockchain proof</p>
                <p className="mt-2 text-sm leading-6 text-white/68">
                  Use the real wallet path when available, or load a sample wallet to preview the proof experience.
                </p>

                <div className="mt-5 grid gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-white/42">Wallet address</div>
                    <input
                      value={walletInput}
                      onChange={(event) => setWalletInput(event.target.value)}
                      placeholder="0x..."
                      className="mt-3 h-11 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white/84 outline-none placeholder:text-white/28 focus:border-[var(--accent)]/40 focus:shadow-[0_0_0_4px_var(--ring)]"
                    />
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={useManualWallet}
                        className="inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white/84 transition hover:-translate-y-0.5 hover:border-white/22 hover:bg-white/[0.07]"
                      >
                        Use entered wallet
                      </button>
                      <button
                        type="button"
                        onClick={useSampleWallet}
                        className="inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white/84 transition hover:-translate-y-0.5 hover:border-white/22 hover:bg-white/[0.07]"
                      >
                        Load sample wallet
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAnchor}
                    disabled={!blockchainLive || anchorState === "anchoring" || anchorState === "connecting"}
                    className="inline-flex items-center justify-center rounded-2xl border border-[var(--accent)]/22 bg-[rgba(0,230,118,.11)] px-4 py-3 text-sm text-white transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:bg-[rgba(0,230,118,.16)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {anchorState === "anchoring"
                      ? "Anchoring score..."
                      : anchorState === "connecting"
                        ? "Connecting wallet..."
                        : anchorState === "anchored"
                          ? "Anchor updated score"
                          : "Connect wallet for live chain proof"}
                  </button>

                </div>

                <div className="mt-5 space-y-3 rounded-3xl border border-white/10 bg-black/30 p-4">
                  <ChainRow label="Address" value={walletAddress ?? "Link a wallet or load sample mode"} />
                  <ChainRow
                    label="Transaction"
                    value={lastTxHash ? shortHash(lastTxHash, 12, 8) : "Generated after anchor"}
                  />
                  <ChainRow
                    label="Status"
                    value={
                      anchorState === "demo"
                        ? "Sample proof loaded"
                        : anchorState === "anchored"
                          ? "Confirmed on Base"
                          : blockchainLive
                            ? "Live chain available"
                            : "Sample preview available"
                    }
                  />
                </div>

                {txHref ? (
                  <a
                    href={txHref}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--accent)] transition hover:text-white"
                  >
                    View latest proof on BaseScan
                  </a>
                ) : null}

                {anchorError ? <p className="mt-4 text-sm text-rose-300/85">{anchorError}</p> : null}
              </div>
            </div>
          </div>
        </GlassCard>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
          <IntelCard
            title="Banks"
            icon={Landmark}
            progress={Math.min(96, Math.round(scoreData.factors.revenuePower * 0.72))}
            summary="Loan-fit signal"
            detail="Higher revenue power and stable irrigation behavior improve repayment confidence."
          />
          <IntelCard
            title="Insurers"
            icon={Shield}
            progress={Math.min(96, Math.round(scoreData.factors.cropHealth * 0.62))}
            summary="Claim-risk signal"
            detail="Live diagnosis reshapes crop-health confidence for underwriting decisions in real time."
          />
          <IntelCard
            title="Government"
            icon={Banknote}
            progress={Math.min(96, Math.round(scoreData.factors.dataTrust * 0.78))}
            summary="Subsidy readiness"
            detail="Trust signals and diagnosis history make support eligibility easier to explain and audit."
          />
        </div>
      </div>
    </Section>
  );
}

function ChainRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/8 pb-3 last:border-b-0 last:pb-0">
      <span className="text-[11px] uppercase tracking-[0.24em] text-white/42">{label}</span>
      <span className="max-w-[65%] text-right text-sm text-white/78">{value}</span>
    </div>
  );
}

function FactorCard({
  label,
  value,
  hint,
  delay,
}: {
  label: string;
  value: number;
  hint: string;
  delay: number;
}) {
  const progress = Math.min(100, Math.round((value / 170) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 220, damping: 22, delay }}
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02))] p-4"
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100">
        <div className="absolute inset-x-6 top-0 h-20 rounded-full bg-[rgba(0,230,118,.12)] blur-2xl" />
      </div>
      <div className="relative flex h-full flex-col">
        <div className="flex flex-col gap-3">
          <div className="text-[11px] uppercase tracking-[0.24em] text-white/45">{label}</div>
          <div className="inline-flex w-fit items-center rounded-2xl border border-[var(--accent)]/16 bg-[rgba(0,230,118,.09)] px-3 py-2 text-lg font-semibold leading-none text-[var(--accent)]">
            {value}
          </div>
          <div className="min-h-[72px] text-sm leading-6 text-white/58">{hint}</div>
        </div>
        <div className="mt-auto pt-4">
          <div className="h-2 overflow-hidden rounded-full bg-black/35">
            <motion.div
              initial={{ width: "0%" }}
              whileInView={{ width: `${progress}%` }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 150, damping: 24, delay: delay + 0.08 }}
              className="h-full rounded-full bg-[linear-gradient(90deg,rgba(0,230,118,.18),rgba(0,230,118,.92),rgba(255,255,255,.4))]"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function IntelCard({
  title,
  icon: Icon,
  progress,
  summary,
  detail,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  progress: number;
  summary: string;
  detail: string;
}) {
  return (
    <GlassCard className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[radial-gradient(circle_at_center,rgba(0,230,118,.22),rgba(0,0,0,0)_65%)] blur-2xl" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-[var(--accent)]" />
          <p className="text-sm font-medium tracking-tight">{title}</p>
        </div>
        <div className="inline-flex items-center gap-2 text-xs text-white/60">
          <Waves className="h-4 w-4" />
          <span>Live feed active</span>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">{summary}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{progress}%</p>
        </div>
        <div className="rounded-2xl border border-[var(--accent)]/16 bg-[rgba(0,230,118,.09)] p-3">
          <Activity className="h-5 w-5 text-[var(--accent)]" />
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-white/60">{detail}</p>

      <div className="mt-5 h-2 overflow-hidden rounded-full border border-white/10 bg-black/40">
        <motion.div
          initial={{ width: "0%" }}
          whileInView={{ width: `${progress}%` }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 140, damping: 26 }}
          className="h-full bg-[linear-gradient(90deg,rgba(0,230,118,.12),rgba(0,230,118,.85),rgba(0,230,118,.18))]"
        />
      </div>
    </GlassCard>
  );
}
