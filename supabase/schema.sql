-- ============================================================
-- World Cup 26 Team Dashboard — Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- Bets placed by team members
create table if not exists public.bets (
  id            uuid primary key default gen_random_uuid(),
  player_id    text not null check (player_id in ('fitz','miller','roberto','riley')),
  fixture_id   bigint,
  event         text not null,
  selection     text not null,
  stake         numeric(10,2) not null check (stake > 0),
  odds          numeric(10,2) not null check (odds >= 1.01),
  status        text not null default 'open' check (status in ('open','won','lost','void')),
  screenshot_url text,
  created_at    timestamptz not null default now(),
  settled_at    timestamptz
);

create index if not exists bets_player_idx on public.bets (player_id);
create index if not exists bets_status_idx on public.bets (status);
create index if not exists bets_event_idx on public.bets (lower(event));

-- Current balance per player
create table if not exists public.balances (
  player_id    text primary key check (player_id in ('fitz','miller','roberto','riley')),
  balance       numeric(10,2) not null default 100,
  updated_at    timestamptz not null default now()
);

-- Seed default balances if empty
insert into public.balances (player_id, balance) values
  ('fitz', 100), ('miller', 100), ('roberto', 100), ('riley', 100)
on conflict (player_id) do nothing;

-- Balance history (every manual update logged)
create table if not exists public.balance_history (
  id            bigserial primary key,
  player_id    text not null,
  balance       numeric(10,2) not null,
  recorded_at   timestamptz not null default now()
);

create index if not exists balance_history_player_idx on public.balance_history (player_id, recorded_at desc);

-- API response cache
create table if not exists public.api_cache (
  cache_key     text primary key,
  data          jsonb not null,
  fetched_at    timestamptz not null default now()
);

-- Row-level security disabled (we use the service role key from the server only)
alter table public.bets disable row level security;
alter table public.balances disable row level security;
alter table public.balance_history disable row level security;
alter table public.api_cache disable row level security;
