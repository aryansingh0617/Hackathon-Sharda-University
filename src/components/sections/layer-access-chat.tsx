"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useSpring, useTransform } from "framer-motion";
import {
  AlertCircle,
  AudioLines,
  CheckCircle2,
  Mic,
  Paperclip,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
} from "lucide-react";
import { FieldTimeline } from "@/components/FieldTimeline";
import { ImpactDashboard } from "@/components/ImpactDashboard";
import { RecentAnalyses } from "@/components/RecentAnalyses";
import { Section } from "@/components/ui/section";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/cn";
import { useLiveDiagnosis } from "@/lib/live-diagnosis-context";
import { speakBilingualQueued, stopSpeech } from "@/lib/speech";

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onstart: null | (() => void);
  onend: null | (() => void);
  onerror: null | (() => void);
  onresult: null | ((e: SpeechRecognitionEventLike) => void);
  start: () => void;
  stop: () => void;
};

type Result = {
  disease: string;
  confidence: string;
  treatment: string;
  cost: string;
  source: "vision" | "reasoning" | "fallback";
  model: string;
};

type DiagnosisResponse = {
  ok: boolean;
  error: string | null;
  result: Result | null;
  narration?: { en: string; hi: string };
};

type UserEntry = {
  id: string;
  text: string;
  imageUrl?: string | null;
};

const THINKING_STEPS = [
  "Analyzing leaf structure...",
  "Detecting disease patterns...",
  "Matching with crop database...",
];

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Failed to read image."));
    };
    reader.onerror = () => reject(new Error("Failed to read image."));
    reader.readAsDataURL(file);
  });
}

function normalizeResult(value: unknown): Result | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;

  const disease = typeof candidate.disease === "string" ? candidate.disease.trim() : "";
  const confidence = typeof candidate.confidence === "string" ? candidate.confidence.trim() : "";
  const treatment = typeof candidate.treatment === "string" ? candidate.treatment.trim() : "";
  const cost = typeof candidate.cost === "string" ? candidate.cost.trim() : "";
  const source =
    candidate.source === "vision" || candidate.source === "reasoning" || candidate.source === "fallback"
      ? candidate.source
      : null;
  const model = typeof candidate.model === "string" ? candidate.model.trim() : "";

  if (!disease || !confidence || !treatment || !cost || !source || !model) return null;

  return {
    disease,
    confidence,
    treatment,
    cost,
    source,
    model,
  };
}

function extractPercent(value: string) {
  const match = value.match(/(\d+)/);
  return match ? Number.parseInt(match[1], 10) : 0;
}

async function readDiagnosisResponse(response: Response): Promise<DiagnosisResponse | null> {
  try {
    return (await response.json()) as DiagnosisResponse;
  } catch {
    return null;
  }
}

export function AccessChat() {
  const { setLiveDiagnosis } = useLiveDiagnosis();
  const [lang, setLang] = useState<"hi-IN" | "en-IN">("en-IN");
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [thinkingStep, setThinkingStep] = useState<number>(-1);
  const [userEntries, setUserEntries] = useState<UserEntry[]>([]);
  const [historyRefreshKey, setHistoryRefreshKey] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      try {
        recRef.current?.stop?.();
      } catch {}
    };
  }, []);

  function speechSupported() {
    if (typeof window === "undefined") return false;
    const w = window as unknown as {
      SpeechRecognition?: unknown;
      webkitSpeechRecognition?: unknown;
    };
    return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
  }

  function startVoice() {
    if (!speechSupported()) return;
    const SR = ((window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition) as
      | (new () => SpeechRecognitionLike)
      | undefined;
    if (!SR) return;

    const rec = new SR();
    recRef.current = rec;
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (e) => {
      let transcript = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        transcript += e.results[i][0]?.transcript ?? "";
      }
      setInput(transcript.trim());
    };

    try {
      rec.start();
    } catch {}
  }

  function stopVoice() {
    try {
      recRef.current?.stop?.();
    } catch {}
    setListening(false);
  }

  async function onPickFile(file: File | null) {
    if (!file) return;

    setError(null);

    try {
      const nextImage = await fileToDataUrl(file);
      const nextPreview = URL.createObjectURL(file);
      setSelectedImage(nextImage);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return nextPreview;
      });
    } catch {
      setError("We couldn't read that image. Please try another crop photo.");
    }
  }

  async function submit() {
    if (busy) return;
    if (!selectedImage) {
      setError("Upload a crop image to start the diagnosis.");
      return;
    }

    const text = input.trim();
    setInput("");
    setBusy(true);
    setError(null);
    setResult(null);

    const entry: UserEntry = {
      id: `${Date.now()}`,
      text: text || "Please analyze this crop image.",
      imageUrl: previewUrl,
    };
    setUserEntries((current) => [...current, entry]);

    const timers = [0, 650, 1300].map((delay, index) =>
      window.setTimeout(() => setThinkingStep(index), delay),
    );

    try {
      const [response] = await Promise.all([
        fetch("/api/crop-diagnosis", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            image: selectedImage,
            locale: lang,
          }),
        }),
        new Promise((resolve) => window.setTimeout(resolve, 1800)),
      ]);

      const payload = await readDiagnosisResponse(response);
      const parsedResult = normalizeResult(payload?.result);

      if (!response.ok || !payload?.ok || !parsedResult) {
        setError(payload?.error ?? "We couldn't complete the diagnosis. Please retry with a clearer image.");
        return;
      }

      setResult(parsedResult);
      setLiveDiagnosis(parsedResult);
      setHistoryRefreshKey(`${Date.now()}-${parsedResult.disease}`);
      setError(payload.error ?? null);

      if (payload.narration) {
        stopSpeech();
        speakBilingualQueued({
          en: payload.narration.en,
          hi: payload.narration.hi,
          preferred: lang,
        });
      }
    } catch {
      setError("Network issue detected. We kept the interface safe, but the analysis could not finish.");
    } finally {
      timers.forEach((timer) => window.clearTimeout(timer));
      setThinkingStep(-1);
      setBusy(false);
    }
  }

  return (
    <Section
      id="access"
      eyebrow="Layer 1 - Access"
      title="Layer 1: Access."
      subtitle="Where the farmer already is."
      hideHeader
    >
      <div className="grid items-start gap-10 lg:grid-cols-[1.02fr_1.18fr]">
        <div>
          <div className="text-balance text-5xl font-semibold tracking-tight sm:text-6xl">
            <span className="text-white">Layer 1: Access.</span>
            <div className="mt-2 text-white/55">Where the farmer already is.</div>
          </div>

          <div className="mt-10 space-y-8">
            <Feature
              title="Real AI image diagnosis"
              desc="Vision analysis runs first, then falls back deterministically so the same image always gets a stable answer."
            />
            <Feature
              title="Single source of truth"
              desc="The full diagnosis experience renders from one validated result state, with no duplicated output paths."
            />
            <Feature
              title="Startup-grade trust"
              desc="Cinematic motion, friendly guardrails, and resilient handling for network or model failures."
            />
            <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_20px_80px_rgba(0,0,0,.28)] backdrop-blur-xl">
              <p className="text-sm text-white/70">
                AI-powered analysis (hybrid model: real AI + fallback)
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <GlassCard className="p-0">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <div className="text-sm font-medium tracking-tight text-white">AgriSentinel AI Console</div>
                <div className="mt-1 text-xs text-white/50">Real image diagnosis with deterministic safety</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLang((current) => (current === "en-IN" ? "hi-IN" : "en-IN"))}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 backdrop-blur-xl transition hover:border-[var(--accent)]/30 hover:bg-white/10"
                >
                  {lang === "en-IN" ? "EN" : "HI"}
                </button>
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)] shadow-[0_0_24px_rgba(0,230,118,.7)]" />
              </div>
            </div>

            <div className="p-5">
              <div className="mx-auto max-w-3xl">
                <div className="max-h-[560px] overflow-auto pr-1">
                  <div className="flex flex-col gap-3">
                    <ChatBubble role="system" text="Upload a crop image and AgriSentinel will return disease, confidence, treatment, and estimated India-specific cost." />

                    {userEntries.map((entry) => (
                      <ChatBubble key={entry.id} role="user" text={entry.text} imageUrl={entry.imageUrl} />
                    ))}

                    <AnimatePresence mode="wait">
                      {busy ? <ThinkingBubble key="thinking" step={thinkingStep} /> : null}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                      {result ? (
                        <motion.div
                          key={`${result.disease}-${result.confidence}-${result.source}`}
                          initial={{ opacity: 0, y: 18, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ type: "spring", stiffness: 180, damping: 18 }}
                        >
                          <ResultBubble result={result} historyRefreshKey={historyRefreshKey} />
                        </motion.div>
                      ) : null}
                    </AnimatePresence>

                    {!busy && !result ? <ResultFallbackState error={error} /> : null}
                  </div>
                </div>

                <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.045] p-4 text-sm text-white/65">
                  <div className="flex items-center gap-2 text-white/80">
                    <Sparkles className="h-4 w-4 text-[var(--accent)]" />
                    <span>Hybrid AI safety is always on.</span>
                  </div>
                  <p className="mt-2 leading-6">
                    If the live AI path slows down or fails, the same image still maps to a stable fallback diagnosis instead of breaking the experience.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="group inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl transition hover:border-[var(--accent)]/40 hover:bg-white/10 hover:shadow-[0_0_35px_rgba(0,230,118,.18)]"
                  aria-label="Attach image"
                >
                  <Paperclip className="h-5 w-5 text-white/70 transition group-hover:text-white" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    (stopSpeech(),
                    speakBilingualQueued({
                      en: "Voice output active.",
                      hi: "वॉइस आउटपुट सक्रिय है।",
                      preferred: lang,
                    }))
                  }
                  className="group inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl transition hover:border-[var(--accent)]/40 hover:bg-white/10"
                  aria-label="Test voice"
                >
                  <Mic className="h-5 w-5 text-white/70 transition group-hover:text-white" />
                </button>
                <button
                  type="button"
                  disabled={!speechSupported()}
                  onClick={() => (listening ? stopVoice() : startVoice())}
                  className={cn(
                    "group inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl transition hover:border-[var(--accent)]/40 hover:bg-white/10 disabled:opacity-40",
                    listening && "border-[var(--accent)]/40 bg-[rgba(0,230,118,.10)]",
                  )}
                  aria-label="Voice command"
                  title={speechSupported() ? "Voice input" : "Voice input not supported in this browser"}
                >
                  {listening ? (
                    <Square className="h-5 w-5 text-[var(--accent)]" />
                  ) : (
                    <AudioLines className="h-5 w-5 text-white/70 transition group-hover:text-white" />
                  )}
                </button>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submit();
                  }}
                  placeholder="Optional notes: crop type, visible symptoms, location..."
                  className="h-11 min-w-[220px] flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm outline-none placeholder:text-white/35 focus:border-[var(--accent)]/50 focus:shadow-[0_0_0_4px_var(--ring)]"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={submit}
                  className="group inline-flex h-11 items-center gap-2 rounded-2xl border border-[var(--accent)]/25 bg-[rgba(0,230,118,.12)] px-4 text-sm text-white transition hover:border-[var(--accent)]/50 hover:bg-[rgba(0,230,118,.16)] hover:shadow-[0_0_35px_rgba(0,230,118,.18)] disabled:opacity-60"
                >
                  <Send className="h-4 w-4 text-[var(--accent)]" />
                  <span>Analyze</span>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/52">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  Single diagnosis state
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  Upload -&gt; AI -&gt; clean result
                </span>
                {previewUrl ? (
                  <span className="rounded-full border border-[var(--accent)]/20 bg-[rgba(0,230,118,.08)] px-3 py-1 text-white/70">
                    Image ready
                  </span>
                ) : null}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </Section>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="mt-1">
        <CheckCircle2 className="h-5 w-5 text-[var(--accent)] drop-shadow-[0_0_18px_rgba(0,230,118,.55)]" />
      </div>
      <div>
        <div className="text-base font-semibold tracking-tight text-white">{title}</div>
        <div className="mt-1 text-sm leading-6 text-white/55">{desc}</div>
      </div>
    </div>
  );
}

function ChatBubble({
  role,
  text,
  imageUrl,
}: {
  role: "user" | "system";
  text: string;
  imageUrl?: string | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 250, damping: 24 }}
      className={cn("max-w-[92%]", role === "user" ? "ml-auto" : "mx-auto")}
    >
      <div
        className={cn(
          "rounded-3xl border px-4 py-3 text-sm leading-6 shadow-[0_18px_50px_rgba(0,0,0,.18)]",
          role === "user"
            ? "border-[var(--accent)]/18 bg-[rgba(0,230,118,.08)] text-white/88"
            : "border-white/10 bg-white/5 text-center text-white/68",
        )}
      >
        {imageUrl ? (
          <div className="mb-3 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Uploaded crop" className="h-44 w-full object-cover" />
          </div>
        ) : null}
        <div className="whitespace-pre-wrap">{text}</div>
      </div>
    </motion.div>
  );
}

function ThinkingBubble({ step }: { step: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: "spring", stiffness: 180, damping: 20 }}
      className="mr-auto max-w-[92%]"
    >
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/50">
            <Sparkles className="h-4 w-4 text-[var(--accent)]" />
            <span>AI thinking</span>
          </div>
          <div className="flex items-center gap-2">
            {[0, 1, 2].map((index) => (
              <motion.span
                key={index}
                className="h-2 w-2 rounded-full bg-[var(--accent)]"
                animate={{
                  opacity: index <= step ? [0.35, 1, 0.35] : 0.2,
                  scale: index <= step ? [1, 1.35, 1] : 0.9,
                }}
                transition={{ duration: 1.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              />
            ))}
          </div>
        </div>
        <div className="mt-4 h-px overflow-hidden rounded-full bg-white/8">
          <motion.div
            className="h-full bg-[linear-gradient(90deg,rgba(0,230,118,.25),rgba(0,230,118,.95),rgba(0,230,118,.25))]"
            animate={{ width: `${((step + 1) / THINKING_STEPS.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 130, damping: 18 }}
          />
        </div>
        <div className="mt-4 space-y-3">
          {THINKING_STEPS.map((label, index) => (
            <motion.div
              key={label}
              initial={{ opacity: 0.3, x: -6 }}
              animate={{
                opacity: index <= step ? 1 : 0.36,
                x: index <= step ? 0 : -6,
              }}
              transition={{ type: "spring", stiffness: 160, damping: 18 }}
              className="flex items-center gap-3"
            >
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full border border-white/15",
                  index <= step
                    ? "bg-[var(--accent)] shadow-[0_0_18px_rgba(0,230,118,.65)]"
                    : "bg-white/10",
                )}
              />
              <span className="text-sm text-white/78">{label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ResultBubble({
  result,
  historyRefreshKey,
}: {
  result: Result;
  historyRefreshKey: string | null;
}) {
  return (
    <div className="space-y-5">
      <TiltCard>
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.035))] shadow-[0_30px_80px_rgba(0,0,0,.38)] backdrop-blur-xl">
          <div className="relative p-4">
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-x-10 top-0 h-24 rounded-full bg-[rgba(0,230,118,.14)] blur-3xl"
              animate={{ opacity: [0.24, 0.5, 0.24], scale: [0.96, 1.05, 0.96] }}
              transition={{ duration: 3.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />
            <div className="relative flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/58">
                <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
                <span>{result.source === "vision" ? "Vision verified" : "Fallback secured"}</span>
              </div>
              <div className="rounded-full border border-[var(--accent)]/16 bg-[rgba(0,230,118,.08)] px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-white/70">
                {result.model}
              </div>
            </div>

            <div className="relative mt-4 grid gap-4 rounded-3xl border border-white/10 bg-black/30 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-white/42">Detected disease</div>
                  <div className="mt-2 text-2xl font-semibold tracking-tight text-white">{result.disease}</div>
                </div>
                <ConfidenceCounter value={extractPercent(result.confidence)} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <MetricCard label="Treatment" value={result.treatment} />
                <MetricCard label="Estimated cost" value={result.cost} />
              </div>
            </div>
          </div>
        </div>
      </TiltCard>

      <ImpactDashboard result={result} />
      <FieldTimeline refreshKey={historyRefreshKey} />
      <RecentAnalyses refreshKey={historyRefreshKey} />
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-4">
      <div className="text-xs uppercase tracking-[0.22em] text-white/42">{label}</div>
      <div className="mt-2 text-sm leading-6 text-white/82">{value}</div>
    </div>
  );
}

function ConfidenceCounter({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 120, damping: 20, mass: 0.8 });
  const display = useTransform(spring, (latest) => `${Math.round(latest)}%`);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <div className="rounded-3xl border border-[var(--accent)]/20 bg-[rgba(0,230,118,.08)] px-4 py-3 text-right shadow-[0_0_30px_rgba(0,230,118,.12)]">
      <div className="text-[10px] uppercase tracking-[0.24em] text-white/48">Confidence</div>
      <motion.div className="mt-1 text-2xl font-semibold tracking-tight text-[var(--accent)]">{display}</motion.div>
    </div>
  );
}

function ResultFallbackState({ error }: { error: string | null }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 p-5 text-sm text-white/55">
      <div className="flex items-center gap-2 text-white/72">
        <AlertCircle className="h-4 w-4 text-[var(--accent)]" />
        <span>{error ?? "Your diagnosis will appear here after the AI finishes analyzing the uploaded image."}</span>
      </div>
    </div>
  );
}

function TiltCard({ children }: { children: ReactNode }) {
  return (
    <motion.div
      whileHover={{
        y: -4,
        scale: 1.004,
        boxShadow: "0 0 48px rgba(0,230,118,.08)",
      }}
      transition={{ type: "spring", stiffness: 120, damping: 22 }}
    >
      {children}
    </motion.div>
  );
}
