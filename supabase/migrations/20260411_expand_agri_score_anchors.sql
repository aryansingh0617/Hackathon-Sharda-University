alter table if exists public.agri_score_anchors
  add column if not exists annual_income_rs integer,
  add column if not exists loan_amount_rs integer,
  add column if not exists debt_to_income_ratio numeric(6,2),
  add column if not exists input_cost_efficiency_pct numeric(6,2),
  add column if not exists past_loan_repayment text,
  add column if not exists state_avg_debt_rs integer,
  add column if not exists soil_health_index numeric(6,2),
  add column if not exists soil_moisture_pct numeric(6,2),
  add column if not exists yield_vs_benchmark_pct numeric(6,2),
  add column if not exists yield_kg_per_ha numeric(10,2),
  add column if not exists season_consistency_years integer,
  add column if not exists crop_insurance boolean,
  add column if not exists irrigation_access_enc text,
  add column if not exists farming_experience_years integer;

create index if not exists agri_score_anchors_annual_income_idx
  on public.agri_score_anchors (annual_income_rs);

create index if not exists agri_score_anchors_crop_insurance_idx
  on public.agri_score_anchors (crop_insurance);
