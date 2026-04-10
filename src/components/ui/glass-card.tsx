"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export function GlassCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.005 }}
      transition={{ type: "spring", stiffness: 180, damping: 18 }}
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_12px_60px_rgba(0,0,0,.55)] backdrop-blur-xl",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(60%_60%_at_50%_0%,rgba(0,230,118,.14),rgba(0,0,0,0)_75%)] before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-100",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_20%_10%,rgba(255,255,255,.08),rgba(0,0,0,0)_50%)]" />
      <div className="relative">{children}</div>
    </motion.div>
  );
}
