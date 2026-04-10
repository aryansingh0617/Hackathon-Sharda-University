alter table if exists public.farm_intel_events
  add column if not exists source_layer text,
  add column if not exists crop_type text,
  add column if not exists district text,
  add column if not exists locale text,
  add column if not exists diagnosis_label text,
  add column if not exists confidence_pct integer,
  add column if not exists score_value integer,
  add column if not exists risk_level text,
  add column if not exists recommendation_label text,
  add column if not exists acres numeric(10,2),
  add column if not exists gross_revenue_rs integer,
  add column if not exists season_tag text,
  add column if not exists source_mode text,
  add column if not exists wallet_address text,
  add column if not exists tx_hash text;

create index if not exists farm_intel_events_source_layer_idx
  on public.farm_intel_events (source_layer);

create index if not exists farm_intel_events_crop_type_idx
  on public.farm_intel_events (crop_type);

create index if not exists farm_intel_events_diagnosis_label_idx
  on public.farm_intel_events (diagnosis_label);

create index if not exists farm_intel_events_score_value_idx
  on public.farm_intel_events (score_value);
