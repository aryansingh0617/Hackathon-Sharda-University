export type CropKey = "tomato" | "onion" | "cotton" | "chili" | "pomegranate";

export type CropMarketProfile = {
  key: CropKey;
  label: string;
  baseTonsPerAcre: number;
  benchmarkTonsPerAcre: number;
  marketPricePerTon: number;
  productionCostPerAcre: number;
  harvestWindowDays: number;
  idealRainMm7d: number;
  priceVolatilityPct: number;
  marketSource: string;
  marketAsOf: string;
};

export const CROP_MARKET_PROFILES: Record<CropKey, CropMarketProfile> = {
  tomato: {
    key: "tomato",
    label: "Tomato",
    baseTonsPerAcre: 14.2,
    benchmarkTonsPerAcre: 13.4,
    marketPricePerTon: 6000,
    productionCostPerAcre: 55000,
    harvestWindowDays: 10,
    idealRainMm7d: 16,
    priceVolatilityPct: 38,
    marketSource: "Maharashtra mandi average",
    marketAsOf: "2026-02-11",
  },
  onion: {
    key: "onion",
    label: "Onion",
    baseTonsPerAcre: 10.8,
    benchmarkTonsPerAcre: 10.1,
    marketPricePerTon: 8750,
    productionCostPerAcre: 48000,
    harvestWindowDays: 14,
    idealRainMm7d: 14,
    priceVolatilityPct: 29,
    marketSource: "Lasalgaon wholesale average",
    marketAsOf: "2026-03-12",
  },
  cotton: {
    key: "cotton",
    label: "Cotton",
    baseTonsPerAcre: 0.95,
    benchmarkTonsPerAcre: 0.88,
    marketPricePerTon: 73000,
    productionCostPerAcre: 34000,
    harvestWindowDays: 18,
    idealRainMm7d: 12,
    priceVolatilityPct: 16,
    marketSource: "Maharashtra mandi + MSP context",
    marketAsOf: "2026-02-21",
  },
  chili: {
    key: "chili",
    label: "Dry Chili",
    baseTonsPerAcre: 1.15,
    benchmarkTonsPerAcre: 1.02,
    marketPricePerTon: 105000,
    productionCostPerAcre: 90000,
    harvestWindowDays: 9,
    idealRainMm7d: 9,
    priceVolatilityPct: 44,
    marketSource: "Andhra Pradesh dry chilli average",
    marketAsOf: "2026-02-12",
  },
  pomegranate: {
    key: "pomegranate",
    label: "Pomegranate",
    baseTonsPerAcre: 4.8,
    benchmarkTonsPerAcre: 4.5,
    marketPricePerTon: 75000,
    productionCostPerAcre: 160000,
    harvestWindowDays: 16,
    idealRainMm7d: 8,
    priceVolatilityPct: 33,
    marketSource: "Maharashtra mandi average",
    marketAsOf: "2026-02-15",
  },
};

export function normalizeCropKey(crop?: string): CropKey {
  const key = crop?.trim().toLowerCase() as CropKey | undefined;
  return key && key in CROP_MARKET_PROFILES ? key : "tomato";
}
