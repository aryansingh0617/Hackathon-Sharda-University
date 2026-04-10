"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Database, Leaf, ShieldCheck, Waves, Wallet } from "lucide-react";
import { Section } from "@/components/ui/section";
import { GlassCard } from "@/components/ui/glass-card";

type FarmIntelEventType = "diagnosis" | "yield" | "irrigation" | "agri_score";

type FarmIntelEventRecord = {
  id?: string;
  eventType: FarmIntelEventType;
  entityKey: string;
  payload: Record<string, unknown> | null;
  payloadHash: string;
  createdAt?: string;
};

type FarmIntelResponse = {
  ok: boolean;
  storageEnabled: boolean;
  totalEvents: number;
  counts: Partial<Record<FarmIntelEventType, number>>;
  events: FarmIntelEventRecord[];
};

const EVENT_META: Record<
  FarmIntelEventType,
  {
    label: string;
    icon: typeof Leaf;
    accent: string;
  }
> = {
  diagnosis: { label: "Diagnosis", icon: Leaf, accent: "text-emerald-300" },
  yield: { label: "Yield", icon: Database, accent: "text-lime-300" },
  irrigation: { label: "Irrigation", icon: Waves, accent: "text-cyan-300" },
  agri_score: { label: "AgriScore", icon: Wallet, accent: "text-[var(--accent)]" },
};

function formatTime(value?: string) {
  if (!value) return "Recent";

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

function shortHash(value: string, take = 14) {
  return value ? `${value.slice(0, take)}...` : "pending";
}

function eventSummary(event: FarmIntelEventRecord) {
  const payload = event.payload ?? {};

  if (event.eventType === "diagnosis") {
    return {
      title: typeof payload.disease === "string" ? payload.disease : "Crop diagnosis",
      line:
        typeof payload.treatment === "string"
          ? payload.treatment
          : "Diagnosis payload stored for field intelligence.",
    };
  }

  if (event.eventType === "yield") {
    const crop = typeof payload.crop === "string" ? payload.crop : "Crop";
    const maxTons = typeof payload.maxTons === "number" ? `${payload.maxTons} tons max` : "Yield range stored";
    return {
      title: `${crop} yield model`,
      line: maxTons,
    };
  }

  if (event.eventType === "irrigation") {
    return {
      title: typeof payload.decision === "string" ? payload.decision : "Irrigation advisory",
      line:
        typeof payload.reasoning === "string"
          ? payload.reasoning
          : "Water recommendation stored for audit and replay.",
    };
  }

  return {
    title: typeof payload.rating === "string" ? `AgriScore ${payload.rating}` : "AgriScore event",
    line:
      typeof payload.risk === "string"
        ? `${payload.risk} risk profile stored with ledger context.`
        : "Financial readiness snapshot stored.",
  };
}

export function DataVault() {
  const [data, setData] = useState<FarmIntelResponse>({
    ok: true,
    storageEnabled: false,
    totalEvents: 0,
    counts: {},
    events: [],
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const response = await fetch("/api/farm-intel?limit=8", { cache: "no-store" });
        const payload = (await response.json()) as FarmIntelResponse;
        if (ignore) return;
        setData(payload);
      } catch {
        if (ignore) return;
        setData({
          ok: false,
          storageEnabled: false,
          totalEvents: 0,
          counts: {},
          events: [],
        });
      } finally {
        if (!ignore) setLoaded(true);
      }
    }

    void load();
    const timer = window.setInterval(load, 6000);

    return () => {
      ignore = true;
      window.clearInterval(timer);
    };
  }, []);

  const countCards = useMemo(
    () =>
      (Object.keys(EVENT_META) as FarmIntelEventType[]).map((key) => ({
        key,
        ...EVENT_META[key],
        count: data.counts[key] ?? 0,
      })),
    [data.counts],
  );

  return (
    <Section
      id="data-vault"
      eyebrow="Layer 3.5 - FarmIntel Data"
      title="Stored FarmIntel Records"
      subtitle="Every diagnosis, yield forecast, irrigation advisory, and AgriScore event should remain accessible after it is created. This layer reads the stored records directly so the data path is visible."
    >
      <div className="grid gap-6 xl:grid-cols-[.95fr_1.05fr]">
        <GlassCard>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium tracking-tight">Storage status</p>
              <p className="mt-3 max-w-md text-sm leading-6 text-white/66">
                FarmIntel writes now wait for the Supabase result before each API returns, so the site reflects real
                stored state instead of background fire-and-forget events.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/18 bg-[rgba(0,230,118,.08)] px-3 py-1 text-xs text-white/78">
              <span className="h-2 w-2 rounded-full bg-[var(--accent)] shadow-[0_0_18px_rgba(0,230,118,.55)]" />
              <span>{loaded && data.storageEnabled ? "Supabase connected" : "Storage check running"}</span>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {countCards.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 220, damping: 22, delay: index * 0.04 }}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${item.accent}`} />
                      <span className="text-sm font-medium tracking-tight">{item.label}</span>
                    </div>
                    <span className="rounded-2xl border border-white/10 bg-black/20 px-3 py-1 text-sm text-white/80">
                      {item.count}
                    </span>
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.22em] text-white/40">Stored events</p>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-6 rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.02))] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/40">Database access</p>
                <p className="mt-2 text-sm text-white/78">
                  {data.storageEnabled
                    ? `${data.totalEvents} FarmIntel records currently accessible from the app.`
                    : "Supabase storage is not reachable yet. Add the production credentials to enable stored data access."}
                </p>
              </div>
              <ShieldCheck className="h-5 w-5 text-[var(--accent)]" />
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium tracking-tight">Recent records</p>
              <p className="mt-2 text-sm leading-6 text-white/64">
                Latest FarmIntel events pulled from the stored record stream.
              </p>
            </div>
            <Database className="h-5 w-5 text-[var(--accent)]" />
          </div>

          <div className="mt-5 space-y-3">
            {loaded && data.events.length ? (
              data.events.map((event, index) => {
                const meta = EVENT_META[event.eventType];
                const Icon = meta.icon;
                const summary = eventSummary(event);

                return (
                  <motion.div
                    key={event.id ?? `${event.entityKey}-${index}`}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 220, damping: 22, delay: index * 0.05 }}
                    className="rounded-3xl border border-white/10 bg-white/[0.035] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${meta.accent}`} />
                          <p className="text-[11px] uppercase tracking-[0.22em] text-white/42">{meta.label}</p>
                        </div>
                        <p className="mt-2 text-base font-medium tracking-tight text-white">{summary.title}</p>
                        <p className="mt-2 text-sm leading-6 text-white/62">{summary.line}</p>
                      </div>
                      <div className="rounded-2xl border border-[var(--accent)]/16 bg-[rgba(0,230,118,.08)] px-3 py-2 text-xs text-white/84">
                        {formatTime(event.createdAt)}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/45">
                      <span>Entity {event.entityKey}</span>
                      <span>Hash {shortHash(event.payloadHash, 18)}</span>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-white/58">
                {loaded
                  ? "No stored FarmIntel records are available yet. Run a diagnosis or trigger yield and irrigation calculations to populate Supabase."
                  : "Loading stored FarmIntel records..."}
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </Section>
  );
}
