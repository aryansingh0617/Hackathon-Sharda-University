"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Droplets, Gauge, Leaf, Terminal } from "lucide-react";
import { Section } from "@/components/ui/section";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/cn";

type YieldResponse = {
  crop: string;
  district: string;
  acres: number;
  soilHealth: number;
  rainfallMm7d: number;
  diseasePressure: number;
  minTons: number;
  maxTons: number;
  yieldPerAcre: number;
  benchmarkYieldPerAcre: number;
  yieldVsBenchmarkPct: number;
  confidence: number;
  marketPricePerTon: number;
  priceVolatilityPct: number;
  grossRevenueMin: number;
  grossRevenueMax: number;
  productionCostPerAcre: number;
  estimatedProductionCost: number;
  netRevenueMin: number;
  netRevenueMax: number;
  harvestWindowDays: number;
  marketSource: string;
  marketAsOf: string;
};

type IrrigationResponse = {
  decision: string;
  urgency: string;
  reasoning: string;
  waterLitersPerAcre: number;
  nextReviewHours: number;
  targetMoisture: number;
  currentMoisture: number;
  moistureGap: number;
  evapStressIndex: number;
  rainfallOffset: number;
};

const INITIAL_YIELD_FORM = {
  crop: "tomato",
  district: "Nashik",
  acres: 2,
  soilHealth: 74,
  rainfallMm7d: 18,
  diseasePressure: 26,
};

const INITIAL_IRRIGATION_FORM = {
  soilMoisture: 0.34,
  forecastMm: 4,
  temperatureC: 33,
  humidity: 56,
  cropStage: "flowering",
};

function useTilt() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), {
    stiffness: 180,
    damping: 22,
  });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), {
    stiffness: 180,
    damping: 22,
  });

  return {
    style: { rotateX: rx, rotateY: ry },
    onMove: (e: React.PointerEvent) => {
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      mx.set(x);
      my.set(y);
    },
    onLeave: () => {
      mx.set(0);
      my.set(0);
    },
  };
}

function Counter({ to, suffix }: { to: number; suffix?: string }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const dur = 900;
    let raf = 0;
    const loop = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(eased * to));
      if (p < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [to]);

  return (
    <span className="tabular-nums">
      {v}
      {suffix ?? ""}
    </span>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function Intelligence() {
  const tiltA = useTilt();
  const tiltB = useTilt();
  const tiltC = useTilt();

  const [yieldData, setYieldData] = useState<YieldResponse | null>(null);
  const [yieldForm, setYieldForm] = useState(INITIAL_YIELD_FORM);
  const [irri, setIrri] = useState<IrrigationResponse | null>(null);
  const [irriForm, setIrriForm] = useState(INITIAL_IRRIGATION_FORM);

  const logs = useMemo(
    () => [
      "scanning crop signals...",
      "sampling leaf texture and canopy load...",
      "checking rainfall, moisture, and disease bands...",
      "aligning district yield benchmark with current market window...",
      "revenue confidence calibrated...",
      "recommendation ready",
    ],
    [],
  );

  async function fetchYield() {
    const res = await fetch("/api/yield", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(yieldForm),
    });
    const data = (await res.json()) as YieldResponse;
    setYieldData(data);
  }

  async function decideIrrigation() {
    const res = await fetch("/api/irrigation", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(irriForm),
    });
    const data = (await res.json()) as IrrigationResponse;
    setIrri(data);
  }

  useEffect(() => {
    let cancelled = false;

    async function bootstrapSignals() {
      const [yieldRes, irriRes] = await Promise.all([
        fetch("/api/yield", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(INITIAL_YIELD_FORM),
        }),
        fetch("/api/irrigation", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(INITIAL_IRRIGATION_FORM),
        }),
      ]);

      const [nextYield, nextIrri] = (await Promise.all([yieldRes.json(), irriRes.json()])) as [
        YieldResponse,
        IrrigationResponse,
      ];

      if (cancelled) return;
      setYieldData(nextYield);
      setIrri(nextIrri);
    }

    void bootstrapSignals();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Section
      id="intelligence"
      eyebrow="Layer 2 - Intelligence"
      title="Decision Engine"
      subtitle="CropDoctor, YieldID, IrriGuide - spring physics, parallax tilt, and market-shaped farm metrics that actually explain each recommendation."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div
          onPointerMove={tiltA.onMove}
          onPointerLeave={tiltA.onLeave}
          style={{ transformStyle: "preserve-3d", ...tiltA.style }}
          className="will-change-transform"
        >
          <GlassCard className="h-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-[var(--accent)]" />
                <p className="text-sm font-medium tracking-tight">CropDoctor</p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/60">
                terminal feed
              </span>
            </div>
            <div className="mt-4 space-y-2 rounded-2xl border border-white/10 bg-black/40 p-4 font-mono text-[12px] text-white/75">
              {logs.map((line, index) => (
                <motion.div
                  key={line}
                  initial={{ opacity: 0, y: 6 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ type: "spring", stiffness: 220, damping: 22, delay: index * 0.04 }}
                >
                  {line}
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          onPointerMove={tiltB.onMove}
          onPointerLeave={tiltB.onLeave}
          style={{ transformStyle: "preserve-3d", ...tiltB.style }}
          className="will-change-transform"
        >
          <GlassCard className="h-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-[var(--accent)]" />
                <p className="text-sm font-medium tracking-tight">YieldID</p>
              </div>
              <button
                type="button"
                onClick={fetchYield}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 backdrop-blur-3xl transition hover:bg-white/10"
              >
                Predict
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Field label="Crop">
                <input
                  value={yieldForm.crop}
                  onChange={(e) => setYieldForm((state) => ({ ...state, crop: e.target.value }))}
                  placeholder="Crop"
                  className="mt-1 h-11 w-full rounded-2xl border border-white/10 bg-black/30 px-3 text-sm text-white/80 outline-none focus:border-[var(--accent)]/50 focus:shadow-[0_0_0_4px_var(--ring)]"
                />
              </Field>
              <Field label="Location">
                <input
                  value={yieldForm.district}
                  onChange={(e) => setYieldForm((state) => ({ ...state, district: e.target.value }))}
                  placeholder="Location"
                  className="mt-1 h-11 w-full rounded-2xl border border-white/10 bg-black/30 px-3 text-sm text-white/80 outline-none focus:border-[var(--accent)]/50 focus:shadow-[0_0_0_4px_var(--ring)]"
                />
              </Field>
              <Field label="Acres">
                <input
                  value={yieldForm.acres}
                  onChange={(e) => setYieldForm((state) => ({ ...state, acres: Number(e.target.value) || 0 }))}
                  inputMode="decimal"
                  placeholder="Acres"
                  className="mt-1 h-11 w-full rounded-2xl border border-white/10 bg-black/30 px-3 text-sm text-white/80 outline-none focus:border-[var(--accent)]/50 focus:shadow-[0_0_0_4px_var(--ring)]"
                />
              </Field>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Field label="Soil health">
                <input
                  value={yieldForm.soilHealth}
                  onChange={(e) => setYieldForm((state) => ({ ...state, soilHealth: Number(e.target.value) || 0 }))}
                  inputMode="decimal"
                  placeholder="Soil health"
                  className="mt-1 h-11 w-full rounded-2xl border border-white/10 bg-black/30 px-3 text-sm text-white/80 outline-none focus:border-[var(--accent)]/50 focus:shadow-[0_0_0_4px_var(--ring)]"
                />
              </Field>
              <Field label="Rainfall / 7d (mm)">
                <input
                  value={yieldForm.rainfallMm7d}
                  onChange={(e) =>
                    setYieldForm((state) => ({ ...state, rainfallMm7d: Number(e.target.value) || 0 }))
                  }
                  inputMode="decimal"
                  placeholder="Rainfall / 7d"
                  className="mt-1 h-11 w-full rounded-2xl border border-white/10 bg-black/30 px-3 text-sm text-white/80 outline-none focus:border-[var(--accent)]/50 focus:shadow-[0_0_0_4px_var(--ring)]"
                />
              </Field>
              <Field label="Disease pressure">
                <input
                  value={yieldForm.diseasePressure}
                  onChange={(e) =>
                    setYieldForm((state) => ({ ...state, diseasePressure: Number(e.target.value) || 0 }))
                  }
                  inputMode="decimal"
                  placeholder="Disease pressure"
                  className="mt-1 h-11 w-full rounded-2xl border border-white/10 bg-black/30 px-3 text-sm text-white/80 outline-none focus:border-[var(--accent)]/50 focus:shadow-[0_0_0_4px_var(--ring)]"
                />
              </Field>
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-black/30 p-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 240, damping: 22 }}
                className="text-3xl font-semibold tracking-tight"
              >
                {yieldData ? (
                  <>
                    <Counter to={yieldData.minTons} />-<Counter to={yieldData.maxTons} /> tons expected
                  </>
                ) : (
                  "Run projection"
                )}
              </motion.div>
              <p className="mt-3 text-sm leading-6 text-white/60">
                Real inputs now shape the band: acreage, soil health, rainfall pressure, disease pressure, and the
                current market window.
              </p>

              {yieldData ? (
                <>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <StatPill label="Yield / acre" value={`${yieldData.yieldPerAcre} tons`} icon={Leaf} />
                    <StatPill label="Confidence" value={`${yieldData.confidence}%`} icon={Gauge} />
                    <StatPill
                      label="Market price / ton"
                      value={`₹${formatMoney(yieldData.marketPricePerTon)}`}
                      icon={Gauge}
                    />
                    <StatPill
                      label="Vs benchmark"
                      value={`${yieldData.yieldVsBenchmarkPct}% of baseline`}
                      icon={Leaf}
                    />
                    <StatPill
                      label="Net revenue band"
                      value={`₹${formatMoney(yieldData.netRevenueMin)}-₹${formatMoney(yieldData.netRevenueMax)}`}
                      icon={Gauge}
                    />
                    <StatPill label="Harvest window" value={`${yieldData.harvestWindowDays} days`} icon={Leaf} />
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/60">
                    Based on {yieldData.marketSource} pricing as of {yieldData.marketAsOf}. Cost model includes about
                    ₹{formatMoney(yieldData.productionCostPerAcre)} per acre in production spend.
                  </div>
                </>
              ) : null}
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          onPointerMove={tiltC.onMove}
          onPointerLeave={tiltC.onLeave}
          style={{ transformStyle: "preserve-3d", ...tiltC.style }}
          className="will-change-transform"
        >
          <GlassCard className="h-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-[var(--accent)]" />
                <p className="text-sm font-medium tracking-tight">IrriGuide</p>
              </div>
              <button
                type="button"
                onClick={decideIrrigation}
                className={cn(
                  "rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 backdrop-blur-3xl transition hover:bg-white/10",
                )}
              >
                Decide
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-4">
              <div className="grid gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Soil moisture (0-1)">
                    <input
                      value={irriForm.soilMoisture}
                      onChange={(e) =>
                        setIrriForm((state) => ({ ...state, soilMoisture: Number(e.target.value) || 0 }))
                      }
                      inputMode="decimal"
                      className="mt-1 h-10 w-full rounded-2xl border border-white/10 bg-black/30 px-3 text-sm text-white/80 outline-none focus:border-[var(--accent)]/50 focus:shadow-[0_0_0_4px_var(--ring)]"
                    />
                  </Field>
                  <Field label="Forecast rain (mm)">
                    <input
                      value={irriForm.forecastMm}
                      onChange={(e) =>
                        setIrriForm((state) => ({ ...state, forecastMm: Number(e.target.value) || 0 }))
                      }
                      inputMode="decimal"
                      className="mt-1 h-10 w-full rounded-2xl border border-white/10 bg-black/30 px-3 text-sm text-white/80 outline-none focus:border-[var(--accent)]/50 focus:shadow-[0_0_0_4px_var(--ring)]"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="Temp (°C)">
                    <input
                      value={irriForm.temperatureC}
                      onChange={(e) =>
                        setIrriForm((state) => ({ ...state, temperatureC: Number(e.target.value) || 0 }))
                      }
                      inputMode="decimal"
                      className="mt-1 h-10 w-full rounded-2xl border border-white/10 bg-black/30 px-3 text-sm text-white/80 outline-none focus:border-[var(--accent)]/50 focus:shadow-[0_0_0_4px_var(--ring)]"
                    />
                  </Field>
                  <Field label="Humidity">
                    <input
                      value={irriForm.humidity}
                      onChange={(e) =>
                        setIrriForm((state) => ({ ...state, humidity: Number(e.target.value) || 0 }))
                      }
                      inputMode="decimal"
                      className="mt-1 h-10 w-full rounded-2xl border border-white/10 bg-black/30 px-3 text-sm text-white/80 outline-none focus:border-[var(--accent)]/50 focus:shadow-[0_0_0_4px_var(--ring)]"
                    />
                  </Field>
                  <Field label="Crop stage">
                    <select
                      value={irriForm.cropStage}
                      onChange={(e) => setIrriForm((state) => ({ ...state, cropStage: e.target.value }))}
                      className="mt-1 h-10 w-full rounded-2xl border border-white/10 bg-black/30 px-3 text-sm text-white/80 outline-none focus:border-[var(--accent)]/50 focus:shadow-[0_0_0_4px_var(--ring)]"
                    >
                      <option value="seedling">seedling</option>
                      <option value="vegetative">vegetative</option>
                      <option value="flowering">flowering</option>
                      <option value="fruiting">fruiting</option>
                    </select>
                  </Field>
                </div>
              </div>

              <p className="mt-4 text-sm text-white/60">Decision</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{irri ? irri.decision : "-"}</p>
              <p className="mt-2 text-sm leading-6 text-white/60">
                {irri ? irri.reasoning : "Transparent irrigation recommendation powered by moisture and weather."}
              </p>

              {irri ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <StatPill label="Urgency" value={irri.urgency} icon={Droplets} />
                  <StatPill label="Water / acre" value={`${formatMoney(irri.waterLitersPerAcre)} L`} icon={Droplets} />
                  <StatPill label="Moisture gap" value={irri.moistureGap.toFixed(2)} icon={Gauge} />
                  <StatPill label="Next check" value={`${irri.nextReviewHours} hrs`} icon={Gauge} />
                </div>
              ) : null}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </Section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-medium uppercase tracking-[0.2em] text-white/52">
        {label}
      </label>
      {children}
    </div>
  );
}

function StatPill({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.025))] p-3.5">
      <div className="pointer-events-none absolute inset-x-4 top-0 h-14 rounded-full bg-[rgba(0,230,118,.08)] opacity-0 blur-2xl transition duration-500 group-hover:opacity-100" />
      <div className="relative flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/45">
        <div className="rounded-xl border border-[var(--accent)]/16 bg-[rgba(0,230,118,.09)] p-2">
          <Icon className="h-3.5 w-3.5 text-[var(--accent)]" />
        </div>
        {label}
      </div>
      <div className="relative mt-3 text-sm font-medium leading-6 text-white/88">{value}</div>
    </div>
  );
}
