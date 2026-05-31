-- Onward — Supabase schema (complete, with user_id for RLS)
-- Run this in Supabase SQL Editor to recreate tables correctly.
-- WARNING: drops existing tables first — back up any real data.

-- ============================================================
-- Drop & recreate clients
-- ============================================================
drop table if exists public.steps cascade;
drop table if exists public.clients cascade;

create table public.clients (
    id             uuid primary key default gen_random_uuid(),
    user_id        uuid not null references auth.users(id) on delete cascade,
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

-- ============================================================
-- Drop & recreate steps
-- ============================================================
create table public.steps (
    id          uuid primary key default gen_random_uuid(),
    client_id   uuid not null references public.clients(id) on delete cascade,
    user_id     uuid not null references auth.users(id) on delete cascade,
    phase       text,
    title       text not null,
    why         text,
    owner       text,
    prio        text,
    status      text default 'not',
    start       integer default 0,
    due         integer default 0,
    created_at  timestamptz default now()
  );

-- ============================================================
-- Enable Row-Level Security
-- ============================================================
alter table public.clients enable row level security;
alter table public.steps   enable row level security;

-- ============================================================
-- RLS policies — clients
-- ============================================================
create policy "clients_select" on public.clients for select using (auth.uid() = user_id);
create policy "clients_insert" on public.clients for insert with check (auth.uid() = user_id);
create policy "clients_update" on public.clients for update using (auth.uid() = user_id);
create policy "clients_delete" on public.clients for delete using (auth.uid() = user_id);

-- ============================================================
-- RLS policies — steps
-- ============================================================
create policy "steps_select" on public.steps for select using (auth.uid() = user_id);
create policy "steps_insert" on public.steps for insert with check (auth.uid() = user_id);
create policy "steps_update" on public.steps for update using (auth.uid() = user_id);
create policy "steps_delete" on public.steps for delete using (auth.uid() = user_id);

-- ============================================================
-- Indexes
-- ============================================================
create index clients_user_id_idx on public.clients(user_id);
create index steps_client_id_idx on public.steps(client_id);
create index steps_user_id_idx   on public.steps(user_id);
