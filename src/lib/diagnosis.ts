export type Diagnosis = {
  disease: string;
  confidence: string;
  treatment: string;
  cost: string;
};

const FALLBACKS: Array<{
  prefix: string;
  result: Diagnosis;
}> = [
  {
    prefix: "00",
    result: {
      disease: "Early Blight",
      confidence: "92%",
      treatment: "Mancozeb spray",
      cost: "₹480/acre",
    },
  },
  {
    prefix: "11",
    result: {
      disease: "Late Blight",
      confidence: "88%",
      treatment: "Metalaxyl + Mancozeb mix",
      cost: "₹760/acre",
    },
  },
  {
    prefix: "22",
    result: {
      disease: "Powdery Mildew",
      confidence: "85%",
      treatment: "Wettable sulfur spray",
      cost: "₹340/acre",
    },
  },
  {
    prefix: "33",
    result: {
      disease: "Bacterial Leaf Spot",
      confidence: "81%",
      treatment: "Copper oxychloride + hygiene",
      cost: "₹620/acre",
    },
  },
];

export function deterministicDiagnosis(imageHash?: string | null): Diagnosis {
  const h = (imageHash ?? "").toLowerCase();
  for (const f of FALLBACKS) {
    if (h.startsWith(f.prefix)) return f.result;
  }
  return {
    disease: "Early Blight",
    confidence: "86%",
    treatment: "Mancozeb spray",
    cost: "₹480/acre",
  };
}
