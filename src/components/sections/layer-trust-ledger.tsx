"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { Section } from "@/components/ui/section";
import { GlassCard } from "@/components/ui/glass-card";

type AnchorRecord = {
  id?: string;
  walletAddress: string;
  score: number;
  scoreHash: string;
  txHash: string;
  chainId: number;
  diagnosisLabel?: string | null;
  createdAt?: string;
};

const DEMO_ANCHOR: AnchorRecord = {
  walletAddress: "0x7e57C0DE71fB31B9eA458b2aF39a3a0F4bA6D201",
  score: 812,
  scoreHash: "0xe9d2a8347c1a02a618c2e126f1efc8474b230f42ba78201aab98034cb2a74d11",
  txHash: "0x4f7a7c62ac34f1d730fef4e2f47a0ae3a0d0de74af03cf41864772ea6d32ac41",
  chainId: 84532,
  diagnosisLabel: "Early Blight",
};

function shortHash(value: string, take = 14) {
  return value ? `${value.slice(0, take)}...` : "pending";
}

function baseScanUrl(txHash: string) {
  return `https://sepolia.basescan.org/tx/${txHash}`;
}

function formatTime(value?: string) {
  if (!value) return "Sample proof snapshot";

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

export function TrustLedger() {
  const [anchors, setAnchors] = useState<AnchorRecord[]>([]);
  const [storageEnabled, setStorageEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadAnchors() {
      try {
        const response = await fetch("/api/trust-ledger", { cache: "no-store" });
        const payload = (await response.json()) as {
          anchors?: AnchorRecord[];
          storageEnabled?: boolean;
        };

        if (ignore) return;
        setAnchors(payload.anchors ?? []);
        setStorageEnabled(Boolean(payload.storageEnabled));
      } catch {
        if (ignore) return;
        setAnchors([]);
        setStorageEnabled(false);
      } finally {
        if (!ignore) setLoaded(true);
      }
    }

    void loadAnchors();
    const timer = window.setInterval(loadAnchors, 5000);

    return () => {
      ignore = true;
      window.clearInterval(timer);
    };
  }, []);

  const visibleAnchors = anchors.length ? anchors : [DEMO_ANCHOR];

  const feed = useMemo(() => {
    if (!anchors.length) {
      return [
        "[AGRI-SCORE PREVIEW] Sample proof is available while live on-chain anchors are loading.",
        `[BASE SEPOLIA PREVIEW] score ${DEMO_ANCHOR.score} | tx ${shortHash(DEMO_ANCHOR.txHash, 18)} | wallet ${shortHash(DEMO_ANCHOR.walletAddress, 12)}`,
      ];
    }

    return anchors.slice(0, 8).map((anchor) => {
      return `[AGRI-SCORE ON BASE] score ${anchor.score} | tx ${shortHash(anchor.txHash, 18)} | wallet ${shortHash(anchor.walletAddress, 12)}`;
    });
  }, [anchors]);

  return (
    <Section
      id="trust"
      eyebrow="Layer 3 - Trust"
      title="AgriScore Blockchain"
      subtitle="Only AgriScore is anchored on-chain. Live wallet proof stays available, and the trust layer remains readable even before a fresh anchor is created."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
              <p className="text-sm font-medium tracking-tight">AgriScore Chain Feed</p>
            </div>
            <div className="inline-flex items-center gap-2 text-xs text-white/60">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent)] shadow-[0_0_18px_rgba(0,230,118,.6)]" />
              <span>{loaded && storageEnabled ? "Base Sepolia active" : "Proof feed ready"}</span>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/45 p-4 font-mono text-[12px] text-white/75">
            <div className="space-y-2">
              {feed.map((entry, index) => (
                <motion.div
                  key={`${entry}-${index}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 24 }}
                  className="flex items-center gap-2"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                  <span>{entry}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            {visibleAnchors.slice(0, 3).map((anchor) => (
              <div
                key={anchor.id ?? anchor.txHash}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-white/42">AgriScore {anchor.score}</div>
                    <div className="mt-2 text-sm text-white/76">
                      Wallet {shortHash(anchor.walletAddress, 16)} | Hash {shortHash(anchor.scoreHash, 16)}
                    </div>
                    <div className="mt-2 text-xs text-white/46">{formatTime(anchor.createdAt)}</div>
                  </div>
                  <a
                    href={baseScanUrl(anchor.txHash)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl border border-[var(--accent)]/18 bg-[rgba(0,230,118,.08)] px-3 py-2 text-sm text-white/84 transition hover:border-[var(--accent)]/32 hover:bg-[rgba(0,230,118,.12)]"
                  >
                    <ExternalLink className="h-4 w-4 text-[var(--accent)]" />
                    View tx
                  </a>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-sm font-medium tracking-tight">Why it matters</p>
          <p className="mt-3 text-base leading-7 text-white/70">
            Every anchored AgriScore creates a clear proof trail that can be reviewed against the wallet address and
            Base Sepolia transaction.
          </p>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/60">Verification path</p>
            <p className="mt-1 text-sm text-white/80">
              Connect wallet, auto-calculate the score, approve the transaction, then verify the tx hash on Base
              Sepolia.
            </p>
          </div>
        </GlassCard>
      </div>
    </Section>
  );
}
