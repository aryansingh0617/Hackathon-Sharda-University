export type DiagnosisRecord = {
  id?: string;
  disease: string;
  confidence: string;
  treatment: string;
  cost: string;
  source: "vision" | "reasoning" | "fallback";
  model: string;
  locale: "en-IN" | "hi-IN";
  imageFingerprint: string;
  yieldIncrease: string;
  costSaved: string;
  riskReduction: string;
  decisionConfidence: string;
  createdAt?: string;
};

export type DiagnosisHistoryResponse = {
  ok: boolean;
  records: DiagnosisRecord[];
  storageEnabled: boolean;
};

export type LedgerRecord = {
  id?: string;
  eventType: "diagnosis" | "yield" | "irrigation" | "agri_score";
  entityKey: string;
  blockHash: string;
  previousBlockHash: string;
  payloadHash: string;
  height: number;
  createdAt?: string;
};

export type TrustLedgerResponse = {
  ok: boolean;
  records: LedgerRecord[];
  storageEnabled: boolean;
};
