"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type LiveDiagnosis = {
  disease: string;
  confidence: string;
  treatment: string;
  cost: string;
  source: "vision" | "reasoning" | "fallback";
  model: string;
};

type LiveDiagnosisContextValue = {
  liveDiagnosis: LiveDiagnosis | null;
  setLiveDiagnosis: (value: LiveDiagnosis | null) => void;
};

const LiveDiagnosisContext = createContext<LiveDiagnosisContextValue | null>(null);

export function LiveDiagnosisProvider({ children }: { children: ReactNode }) {
  const [liveDiagnosis, setLiveDiagnosis] = useState<LiveDiagnosis | null>(null);

  return (
    <LiveDiagnosisContext.Provider value={{ liveDiagnosis, setLiveDiagnosis }}>
      {children}
    </LiveDiagnosisContext.Provider>
  );
}

export function useLiveDiagnosis() {
  const context = useContext(LiveDiagnosisContext);
  if (!context) {
    throw new Error("useLiveDiagnosis must be used within LiveDiagnosisProvider.");
  }

  return context;
}
