create extension if not exists pgcrypto;

alter table if exists public.diagnoses
  drop constraint if exists diagnoses_source_check;

alter table if exists public.diagnoses
  add constraint diagnoses_source_check
  check (source in ('vision', 'reasoning', 'fallback'));

create table if not exists public.farm_intel_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('diagnosis', 'yield', 'irrigation', 'agri_score')),
  entity_key text not null,
  payload jsonb not null default '{}'::jsonb,
  payload_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists farm_intel_events_created_at_idx
  on public.farm_intel_events (created_at desc);

create index if not exists farm_intel_events_event_type_idx
  on public.farm_intel_events (event_type);

create index if not exists farm_intel_events_entity_key_idx
  on public.farm_intel_events (entity_key);

create index if not exists farm_intel_events_payload_hash_idx
  on public.farm_intel_events (payload_hash);

create table if not exists public.agri_ledger_blocks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.farm_intel_events(id) on delete cascade,
  event_type text not null check (event_type in ('diagnosis', 'yield', 'irrigation', 'agri_score')),
  entity_key text not null,
  payload_hash text not null,
  previous_block_hash text not null default 'GENESIS',
  block_hash text not null unique,
  height integer not null unique,
  created_at timestamptz not null default now()
);

create index if not exists agri_ledger_blocks_created_at_idx
  on public.agri_ledger_blocks (created_at desc);

create index if not exists agri_ledger_blocks_event_type_idx
  on public.agri_ledger_blocks (event_type);

create index if not exists agri_ledger_blocks_event_id_idx
  on public.agri_ledger_blocks (event_id);

create table if not exists public.agri_score_anchors (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  score integer not null,
  score_hash text not null,
  tx_hash text not null unique,
  chain_id integer not null default 84532,
  diagnosis_label text,
  created_at timestamptz not null default now()
);

create index if not exists agri_score_anchors_created_at_idx
  on public.agri_score_anchors (created_at desc);

create index if not exists agri_score_anchors_wallet_address_idx
  on public.agri_score_anchors (wallet_address);

create index if not exists agri_score_anchors_score_hash_idx
  on public.agri_score_anchors (score_hash);
