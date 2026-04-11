"use client";

import { useEffect } from "react";
import { Brain, IndianRupee, ShieldCheck, Sprout, type LucideIcon } from "lucide-react";
import { motion, useSpring, useTransform } from "framer-motion";
import { generateImpact, type ImpactInput } from "@/lib/impact";

const CARD_TRANSITION = {
  type: "spring",
  stiffness: 170,
  damping: 18,
  mass: 0.9,
} as const;

export function ImpactDashboard({ result }: { result: ImpactInput }) {
  const impact = generateImpact(result);

  const cards = [
    {
      title: "Yield Increase",
      value: impact.yieldIncrease,
      icon: Sprout,
      prefix: "+",
      suffix: "%",
      numericValue: Number.parseInt(impact.yieldIncrease, 10),
      accent: "from-[rgba(0,230,118,.18)] to-transparent",
    },
    {
      title: "Cost Saved",
      value: impact.costSaved,
      icon: IndianRupee,
      prefix: "\u20b9",
      suffix: "",
      numericValue: Number.parseInt(impact.costSaved.replace(/[^\d]/g, ""), 10),
      accent: "from-[rgba(0,230,118,.14)] to-transparent",
    },
    {
      title: "Risk Reduction",
      value: impact.riskReduction,
      icon: ShieldCheck,
      accent: "from-[rgba(255,255,255,.08)] to-transparent",
    },
    {
      title: "Decision Confidence",
      value: impact.decisionConfidence,
      icon: Brain,
      prefix: "",
      suffix: "%",
      numericValue: Number.parseInt(impact.decisionConfidence, 10),
      accent: "from-[rgba(0,230,118,.14)] to-transparent",
    },
  ] as const;

  return (
    <motion.section
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...CARD_TRANSITION, delay: 0.08 }}
      className="mt-5 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.025))] p-5 shadow-[0_30px_90px_rgba(0,0,0,.32)] backdrop-blur-2xl"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]/80">
            Estimated Farm Impact
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            Estimated Farm Impact
          </h3>
        </div>
        <p className="max-w-xl text-sm leading-6 text-white/55">
          Real-world translation of the diagnosis so treatment decisions feel immediate, practical, and measurable.
        </p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {cards.map((card, index) => (
          <ImpactCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            accent={card.accent}
            delay={index * 0.08}
            prefix={"prefix" in card ? card.prefix : undefined}
            suffix={"suffix" in card ? card.suffix : undefined}
            numericValue={"numericValue" in card ? card.numericValue : undefined}
          />
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...CARD_TRANSITION, delay: 0.34 }}
        className="mt-5 rounded-3xl border border-[var(--accent)]/16 bg-[rgba(0,230,118,.08)] px-4 py-3 text-sm text-white/84 shadow-[0_0_40px_rgba(0,230,118,.08)]"
      >
        This isn&apos;t just analysis. This is income protection for farmers.
      </motion.p>
    </motion.section>
  );
}

function ImpactCard({
  title,
  value,
  icon: Icon,
  accent,
  delay,
  numericValue,
  prefix = "",
  suffix = "",
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  accent: string;
  delay: number;
  numericValue?: number;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...CARD_TRANSITION, delay }}
      whileHover={{
        y: -6,
        boxShadow: "0 0 36px rgba(0,230,118,.16), 0 24px 48px rgba(0,0,0,.28)",
      }}
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[rgba(255,255,255,.05)] p-5 backdrop-blur-xl"
    >
      <motion.div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent} opacity-60`}
        style={{
          backgroundImage:
            "radial-gradient(circle at top left, rgba(0,230,118,.22), rgba(0,0,0,0) 62%)",
        }}
        animate={{ scale: [1, 1.06, 1], opacity: [0.42, 0.64, 0.42] }}
        transition={{ duration: 3.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <div className="pointer-events-none absolute inset-0 rounded-3xl border border-[var(--accent)]/0 transition group-hover:border-[var(--accent)]/18" />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">{title}</p>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-white">
            {typeof numericValue === "number" ? (
              <CountUpValue value={numericValue} prefix={prefix} suffix={suffix} />
            ) : (
              value
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--accent)]/20 bg-[rgba(0,230,118,.08)] p-3 shadow-[0_0_26px_rgba(0,230,118,.12)]">
          <Icon className="h-5 w-5 text-[var(--accent)]" />
        </div>
      </div>
    </motion.div>
  );
}

function CountUpValue({
  value,
  prefix = "",
  suffix = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  const spring = useSpring(0, { stiffness: 110, damping: 20, mass: 0.85 });
  const display = useTransform(spring, (latest) => `${prefix}${Math.round(latest)}${suffix}`);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}
