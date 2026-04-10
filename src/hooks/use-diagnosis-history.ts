"use client";

import { useEffect, useState } from "react";
import type { DiagnosisHistoryResponse, DiagnosisRecord } from "@/lib/diagnosis-types";

export function useDiagnosisHistory(refreshKey: string | null) {
  const [records, setRecords] = useState<DiagnosisRecord[]>([]);
  const [storageEnabled, setStorageEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadHistory() {
      try {
        const response = await fetch("/api/diagnosis-history", { cache: "no-store" });
        const payload = (await response.json()) as DiagnosisHistoryResponse;
        if (ignore) return;
        setRecords(payload.records ?? []);
        setStorageEnabled(Boolean(payload.storageEnabled));
      } catch {
        if (ignore) return;
        setRecords([]);
        setStorageEnabled(false);
      } finally {
        if (!ignore) setLoaded(true);
      }
    }

    loadHistory();

    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  return {
    records,
    storageEnabled,
    loaded,
  };
}
