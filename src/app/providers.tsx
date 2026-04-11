"use client";

import { ReactNode, useEffect } from "react";
import Lenis from "lenis";
import { AuthSessionProvider } from "@/lib/auth-session-context";
import { LiveDiagnosisProvider } from "@/lib/live-diagnosis-context";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      smoothWheel: true,
      syncTouch: true,
      touchMultiplier: 1.2,
      wheelMultiplier: 0.9,
    });

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  return (
    <AuthSessionProvider>
      <LiveDiagnosisProvider>{children}</LiveDiagnosisProvider>
    </AuthSessionProvider>
  );
}
