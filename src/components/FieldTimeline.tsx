"use client";

import { motion } from "framer-motion";
import { Activity, Clock3, TrendingUp } from "lucide-react";
import { useDiagnosisHistory } from "@/hooks/use-diagnosis-history";

const CARD_TRANSITION = {
  type: "spring",
  stiffness: 150,
  damping: 18,
  mass: 0.92,
} as const;

function percent(value: string) {
  const match = value.match(/(\d+)/);
  return match ? Number.parseInt(match[1], 10) : 0;
}

function formatLabel(value?: string, index = 0) {
  if (index === 0) return "Today";
  if (!value) return `Scan ${index + 1}`;

  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
    }).format(new Date(value));
  } catch {
    return `Scan ${index + 1}`;
  }
}

export function FieldTimeline({ refreshKey }: { refreshKey: string | null }) {
  const { records, storageEnabled, loaded } = useDiagnosisHistory(refreshKey);
  const timeline = records.slice(0, 4);

  if (!loaded || !storageEnabled || timeline.length < 2) {
    return null;
  }

  const latest = timeline[0];
  const oldest = timeline[timeline.length - 1];
  const confidenceDelta = percent(latest.decisionConfidence) - percent(oldest.decisionConfidence);

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...CARD_TRANSITION, delay: 0.1 }}
      className="mt-5 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.02))] p-5 shadow-[0_24px_70px_rgba(0,0,0,.28)] backdrop-blur-xl"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]/78">
            Longitudinal View
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            Field Timeline
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/58">
            Today versus the last 3 scans, so crop progression is visible instead of reduced to one static prediction.
          </p>
        </div>
        <div className="rounded-3xl border border-[var(--accent)]/16 bg-[rgba(0,230,118,.08)] px-4 py-3 text-sm text-white/84">
          Confidence trend: {confidenceDelta >= 0 ? "+" : ""}
          {confidenceDelta}% across recent scans
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="relative flex items-start justify-between gap-4">
            <div className="pointer-events-none absolute left-0 right-0 top-8 h-px bg-[linear-gradient(90deg,rgba(0,230,118,.12),rgba(0,230,118,.9),rgba(0,230,118,.12))]" />

            {timeline.map((record, index) => (
              <motion.div
                key={record.id ?? `${record.imageFingerprint}-${index}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...CARD_TRANSITION, delay: index * 0.06 }}
                className="relative z-10 flex-1"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[var(--accent)]/24 bg-[rgba(0,230,118,.08)] shadow-[0_0_26px_rgba(0,230,118,.12)]">
                  <Activity className="h-5 w-5 text-[var(--accent)]" />
                </div>

                <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.045] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-white/42">
                      {formatLabel(record.createdAt, index)}
                    </div>
                    <div className="text-sm font-medium text-[var(--accent)]">
                      {record.decisionConfidence}
                    </div>
                  </div>

                  <div className="mt-3 text-lg font-semibold tracking-tight text-white">
                    {record.disease}
                  </div>

                  <div className="mt-4 grid gap-3">
                    <TimelineMetric icon={TrendingUp} label="Yield" value={record.yieldIncrease} />
                    <TimelineMetric icon={Clock3} label="Risk" value={record.riskReduction} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function TimelineMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
      <div className="flex items-center gap-2 text-white/56">
        <Icon className="h-4 w-4 text-[var(--accent)]" />
        <span className="text-xs uppercase tracking-[0.2em]">{label}</span>
      </div>
      <span className="text-sm font-medium text-white/84">{value}</span>
    </div>
  );
}
