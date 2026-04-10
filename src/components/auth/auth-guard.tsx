"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { Leaf } from "lucide-react";
import { useAuthSession } from "@/lib/auth-session-context";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { ready, session } = useAuthSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !session && pathname !== "/signin") {
      router.replace("/signin");
    }
  }, [pathname, ready, router, session]);

  if (!ready || !session) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 170, damping: 20 }}
          className="w-full max-w-md rounded-[32px] border border-white/10 bg-white/5 p-8 text-center shadow-[0_30px_80px_rgba(0,0,0,.45)] backdrop-blur-2xl"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--accent)]/20 bg-[rgba(0,230,118,.08)]">
            <Leaf className="h-6 w-6 text-[var(--accent)]" />
          </div>
          <p className="mt-5 text-xs uppercase tracking-[0.28em] text-white/45">AgriSentinel</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Loading secure farm workspace</h1>
          <p className="mt-3 text-sm leading-6 text-white/60">
            Preparing the live diagnosis, intelligence, trust, and finance layers.
          </p>
        </motion.div>
      </main>
    );
  }

  return <>{children}</>;
}
