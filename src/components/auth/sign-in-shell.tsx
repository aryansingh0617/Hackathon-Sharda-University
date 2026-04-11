"use client";

import { FormEvent, useEffect, useState, type ComponentType } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Leaf, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/lib/auth-session-context";

export function SignInShell() {
  const router = useRouter();
  const { ready, session, signIn, enterGuest } = useAuthSession();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (ready && session) {
      router.replace("/");
    }
  }, [ready, router, session]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    signIn({
      name: trimmedName,
      phone,
    });
    router.replace("/");
  }

  function handleGuest() {
    enterGuest();
    router.replace("/");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_0%,rgba(0,230,118,.14),rgba(0,0,0,0)_55%)]" />
        <div className="absolute left-0 top-0 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,.06),rgba(0,0,0,0)_68%)] blur-3xl" />
        <div className="agri-noise absolute inset-0 opacity-35" />
      </div>

      <div className="grid w-full max-w-6xl items-stretch gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 150, damping: 20 }}
          className="rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.03))] p-8 shadow-[0_35px_90px_rgba(0,0,0,.45)] backdrop-blur-2xl"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/72">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)] shadow-[0_0_18px_rgba(0,230,118,.55)]" />
            Farm intelligence for real-world decisions
          </div>

          <h1 className="mt-8 max-w-3xl text-balance text-5xl font-semibold tracking-tight sm:text-6xl">
            Sign in to your farm command layer.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/64">
            Enter as a farmer profile or continue in guest mode for fast access. Either way, the full AI diagnosis,
            YieldID, IrriGuide, FarmIntel, and AgriScore flow stays available.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <FeatureChip
              icon={Sparkles}
              title="Live diagnosis"
              text="Vision + fallback safety for every crop image."
            />
            <FeatureChip
              icon={ShieldCheck}
              title="Stored records"
              text="Every event lands in FarmIntel and stays queryable."
            />
            <FeatureChip
              icon={Leaf}
              title="Real AgriScore"
              text="Financial readiness updates from live farm signals."
            />
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 160, damping: 20, delay: 0.05 }}
          className="rounded-[36px] border border-[var(--accent)]/14 bg-[radial-gradient(circle_at_top,rgba(0,230,118,.12),rgba(255,255,255,.04)_42%,rgba(0,0,0,.2))] p-8 shadow-[0_35px_90px_rgba(0,0,0,.48)] backdrop-blur-2xl"
        >
          <p className="text-xs uppercase tracking-[0.28em] text-white/45">Access gateway</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Secure farm entry</h2>
          <p className="mt-3 text-sm leading-6 text-white/62">
            Keep it simple for the demo. Sign in with a farmer name, or continue instantly as a guest.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/45">Farmer name</span>
              <div className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4">
                <UserRound className="h-4 w-4 text-white/45" />
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Aryan Patil"
                  className="h-full flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/28"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/45">Phone or WhatsApp</span>
              <div className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4">
                <span className="text-sm text-white/45">+91</span>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="9876543210"
                  className="h-full flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/28"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={!name.trim()}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--accent)]/24 bg-[rgba(0,230,118,.12)] text-sm text-white transition hover:-translate-y-0.5 hover:border-[var(--accent)]/45 hover:bg-[rgba(0,230,118,.17)] disabled:cursor-not-allowed disabled:opacity-55"
            >
              <span>Enter dashboard</span>
              <ArrowRight className="h-4 w-4 text-[var(--accent)]" />
            </button>
          </form>

          <div className="mt-4 grid gap-3">
            <button
              type="button"
              onClick={handleGuest}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.05] text-sm text-white/86 transition hover:-translate-y-0.5 hover:border-white/22 hover:bg-white/[0.08]"
            >
              Continue in guest mode
            </button>
          </div>

          <div className="mt-6 rounded-3xl border border-white/10 bg-black/25 p-4 text-sm leading-6 text-white/58">
            Guest mode keeps the full product available instantly, while farmer sign-in personalizes the session
            header for a cleaner live demo.
          </div>
        </motion.section>
      </div>
    </main>
  );
}

function FeatureChip({
  icon: Icon,
  title,
  text,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--accent)]/16 bg-[rgba(0,230,118,.09)]">
        <Icon className="h-4 w-4 text-[var(--accent)]" />
      </div>
      <div className="mt-4 text-sm font-medium tracking-tight text-white">{title}</div>
      <div className="mt-2 text-sm leading-6 text-white/58">{text}</div>
    </div>
  );
}
