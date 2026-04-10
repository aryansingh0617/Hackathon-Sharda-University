create extension if not exists pgcrypto;

create table if not exists public.diagnoses (
  id uuid primary key default gen_random_uuid(),
  disease text not null,
  confidence text not null,
  treatment text not null,
  cost text not null,
  source text not null check (source in ('vision', 'fallback')),
  model text not null,
  locale text not null check (locale in ('en-IN', 'hi-IN')),
  image_fingerprint text not null,
  yield_increase text not null,
  cost_saved text not null,
  risk_reduction text not null,
  decision_confidence text not null,
  created_at timestamptz not null default now()
);

create index if not exists diagnoses_created_at_idx
  on public.diagnoses (created_at desc);

create index if not exists diagnoses_image_fingerprint_idx
  on public.diagnoses (image_fingerprint);
