"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowDown, Leaf, LogOut, Shield, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { useAuthSession } from "@/lib/auth-session-context";

const line = "AgriSentinel is not an app.\nIt is the intelligence layer of agriculture.";

export function Hero() {
  const words = line.split(/(\s+)/);
  const router = useRouter();
  const { session, signOut } = useAuthSession();

  function handleSignOut() {
    signOut();
    router.replace("/signin");
  }

  return (
    <section className="relative min-h-[100svh] px-6 pt-24">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_20%,rgba(0,230,118,.18),rgba(0,0,0,0)_58%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_70%_10%,rgba(255,255,255,.06),rgba(0,0,0,0)_52%)]" />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 backdrop-blur-3xl">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_16px_rgba(0,230,118,.55)]" />
            <span>India&apos;s Agricultural Intelligence Infrastructure</span>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <div className="flex items-center gap-2 text-xs text-white/60">
              <Sparkles className="h-4 w-4 text-white/70" />
              <span>Built for farmers, not interfaces.</span>
            </div>
            {session ? (
              <>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/78 backdrop-blur-3xl">
                  <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                  <span>{session.mode === "guest" ? "Guest mode" : session.name}</span>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/78 transition hover:border-[var(--accent)]/28 hover:bg-white/10"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Exit
                </button>
              </>
            ) : null}
          </div>
        </div>

        <motion.h1
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.02, delayChildren: 0.15 } },
          }}
          className="text-balance text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl"
        >
          {words.map((w, i) =>
            w.trim().length === 0 ? (
              <span key={`sp-${i}`}>{w}</span>
            ) : (
              <motion.span
                key={`w-${i}`}
                className="inline-block"
                variants={{
                  hidden: { y: 16, opacity: 0, filter: "blur(10px)" },
                  show: {
                    y: 0,
                    opacity: 1,
                    filter: "blur(0px)",
                    transition: { type: "spring", stiffness: 220, damping: 22 },
                  },
                }}
              >
                {w}
              </motion.span>
            ),
          )}
        </motion.h1>

        <div className="grid gap-5 lg:grid-cols-3">
          <GlassCard className="lg:col-span-2">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-sm text-white/70">
                  Not data. <span className="text-white">Decisions.</span>
                </p>
                <p className="mt-3 text-base leading-7 text-white/70">
                  Real-time crop diagnosis, yield forecasting, and irrigation guidance, packaged in a premium,
                  cinematic experience.
                </p>
              </div>
              <div className="hidden shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70 backdrop-blur-3xl sm:flex">
                <span className="h-2 w-2 rounded-full bg-[var(--accent)] shadow-[0_0_18px_rgba(0,230,118,.6)]" />
                <span>Live Decision Engine</span>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                <Leaf className="h-5 w-5 text-[var(--accent)]" />
                <div>
                  <p className="text-sm font-medium tracking-tight">CropDoctor</p>
                  <p className="text-xs text-white/60">Image to diagnosis</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                <Sparkles className="h-5 w-5 text-[var(--accent)]" />
                <div>
                  <p className="text-sm font-medium tracking-tight">YieldID</p>
                  <p className="text-xs text-white/60">Market-shaped yield and revenue bands</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                <Shield className="h-5 w-5 text-[var(--accent)]" />
                <div>
                  <p className="text-sm font-medium tracking-tight">AgriTrust</p>
                  <p className="text-xs text-white/60">Trust is infra</p>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="flex flex-col justify-between">
            <div>
              <p className="text-sm text-white/70">Start here</p>
              <p className="mt-2 text-base leading-7 text-white/70">
                Scroll to experience the platform layers: Access, Intelligence, Trust, Finance.
              </p>
            </div>
            <motion.div
              initial={{ y: 0 }}
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              className="mt-6 flex items-center gap-2 text-sm text-white/70"
            >
              <ArrowDown className="h-4 w-4 text-[var(--accent)]" />
              <span>Scroll</span>
            </motion.div>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}
