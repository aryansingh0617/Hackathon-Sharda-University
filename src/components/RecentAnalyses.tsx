"use client";

import { motion } from "framer-motion";
import { Clock3, Database, ShieldCheck } from "lucide-react";
import { useDiagnosisHistory } from "@/hooks/use-diagnosis-history";

const CARD_TRANSITION = {
  type: "spring",
  stiffness: 155,
  damping: 19,
  mass: 0.92,
} as const;

function formatTime(value?: string) {
  if (!value) return "Just now";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "Recent";
  }
}

function formatModel(value: string) {
  if (!value) return "AI model";

  if (value === "deterministic-mapper-v2") {
    return "Deterministic mapper";
  }

  return value.replace(/[-_]/g, " ");
}

export function RecentAnalyses({ refreshKey }: { refreshKey: string | null }) {
  const { records, storageEnabled, loaded } = useDiagnosisHistory(refreshKey);

  if (!loaded) {
    return (
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-36 animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]"
          />
        ))}
      </div>
    );
  }

  if (!storageEnabled) {
    return (
      <div className="mt-5 rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-white/58">
        History storage is ready to use. Add Supabase credentials to start saving live diagnosis records.
      </div>
    );
  }

  if (!records.length) {
    return (
      <div className="mt-5 rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-white/58">
        The storage layer is active. Your recent analyses will appear here after the next successful diagnosis.
      </div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...CARD_TRANSITION, delay: 0.12 }}
      className="mt-5 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.02))] p-5 shadow-[0_24px_70px_rgba(0,0,0,.28)] backdrop-blur-xl"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]/78">
            Persistence Layer
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            Recent Analyses
          </h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/58">
          <Database className="h-4 w-4 text-[var(--accent)]" />
          <span>Stored farmer-impact snapshots</span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
        {records.map((record, index) => (
          <motion.div
            key={record.id ?? `${record.imageFingerprint}-${index}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...CARD_TRANSITION, delay: index * 0.06 }}
            whileHover={{
              y: -4,
              boxShadow: "0 0 36px rgba(0,230,118,.1), 0 20px 44px rgba(0,0,0,.26)",
            }}
            className="flex h-full min-h-[26rem] flex-col rounded-3xl border border-white/10 bg-white/[0.045] p-4"
          >
            <div className="flex min-h-[6.5rem] items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[11px] uppercase tracking-[0.22em] text-white/42">
                  {record.source === "vision" ? "Live AI" : "Fallback"}
                </div>
                <div className="mt-2 min-h-[4.5rem] text-lg font-semibold tracking-tight text-white">
                  {record.disease}
                </div>
              </div>
              <div className="shrink-0 rounded-2xl border border-[var(--accent)]/18 bg-[rgba(0,230,118,.08)] px-3 py-2 text-sm font-medium text-[var(--accent)]">
                {record.confidence}
              </div>
            </div>

            <div className="mt-4 grid auto-rows-fr grid-cols-2 gap-3">
              <Metric label="Yield" value={record.yieldIncrease} />
              <Metric label="Saved" value={record.costSaved} />
              <Metric label="Risk" value={record.riskReduction} />
              <Metric label="Decision" value={record.decisionConfidence} />
            </div>

            <div className="mt-auto grid grid-cols-2 gap-3 pt-4 text-xs text-white/45">
              <div className="flex items-start gap-2">
                <Clock3 className="h-3.5 w-3.5 text-[var(--accent)]" />
                <span className="leading-5">{formatTime(record.createdAt)}</span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-[var(--accent)]" />
                <span className="leading-5 text-white/52">{formatModel(record.model)}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex h-full min-h-[5.75rem] flex-col rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
      <div className="text-[10px] uppercase tracking-[0.22em] text-white/42">{label}</div>
      <div className="mt-2 text-sm font-medium leading-6 text-white/85">{value}</div>
    </div>
  );
}
