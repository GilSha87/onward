-- Onward — Supabase schema
-- Run this in the Supabase SQL editor (or via the CLI) to provision the
-- tables the app reads/writes. Column names match src/lib/dbMapper.js.

-- ---------------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------------
create table if not exists public.clients (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  icp            text,
  flow           text,
  touch          text,
  country        text,
  flag           text,
  lang           text,
  color          text,
  mono           text,
  kickoff        text,
  am             text,
  day_in         integer default 0,
  phase          text,
  status         text default 'active',
  contacts       jsonb default '[]'::jsonb,
  progress_done  integer default 0,
  progress_total integer default 20,
  created_at     timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- steps  (one row per onboarding step, owned by a client)
-- ---------------------------------------------------------------------------
create table if not exists public.steps (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.clients(id) on delete cascade,
  phase      text,
  title      text not null,
  why        text default '',
  owner      text,
  prio       text,
  status     text default 'not',
  "start"    integer default 0,
  due        integer default 0,
  created_at timestamptz default now()
);

create index if not exists steps_client_id_idx on public.steps (client_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Enable RLS and allow authenticated users full access. Tighten these
-- policies (e.g. scope by `am` / auth.uid()) before production use.
-- ---------------------------------------------------------------------------
alter table public.clients enable row level security;
alter table public.steps   enable row level security;

create policy "clients_authenticated_all" on public.clients
  for all to authenticated using (true) with check (true);

create policy "steps_authenticated_all" on public.steps
  for all to authenticated using (true) with check (true);
