-- Migration 014: Client questions inbox
--
-- Backs the client-detail "Inbox" tab with a real table (replaces the in-memory
-- mock). Each question belongs to a client, optionally references a step, and
-- carries a status and an inline replies log. RLS mirrors the steps model:
-- org-wide read for any authenticated user; create/respond/resolve for Staff +
-- Admin (Executive is read-only).

begin;

create table if not exists public.questions (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  step_id     uuid references public.steps(id) on delete set null,
  author      text not null,
  body        text not null,
  status      text not null default 'open' check (status in ('open', 'resolved')),
  replies     jsonb not null default '[]'::jsonb,   -- [{ author, body, at }]
  created_at  timestamptz not null default now()
);

create index if not exists questions_client_id_idx on public.questions(client_id);

alter table public.questions enable row level security;

drop policy if exists "questions_select" on public.questions;
drop policy if exists "questions_insert" on public.questions;
drop policy if exists "questions_update" on public.questions;

create policy "questions_select" on public.questions
  for select using (auth.uid() is not null);
create policy "questions_insert" on public.questions
  for insert with check (public.current_user_role() in ('Staff', 'Admin'));
create policy "questions_update" on public.questions
  for update
  using (public.current_user_role() in ('Staff', 'Admin'))
  with check (public.current_user_role() in ('Staff', 'Admin'));

-- Seed 1 open + 1 resolved question on a demo client (UI Verify Co) so the
-- inbox, sub-counter, and tab badge are demoable and the resolve->0 flow can be
-- exercised. The open one references a real step where available.
insert into public.questions (client_id, step_id, author, body, status)
select '278b7176-402c-4b7e-967c-eb04e3bbf918', s.id, 'Adrian Park',
       'We use HubSpot Enterprise — can we map deals to sites both ways?', 'open'
from public.steps s
where s.client_id = '278b7176-402c-4b7e-967c-eb04e3bbf918'
order by s.due
limit 1;

insert into public.questions (client_id, step_id, author, body, status)
values ('278b7176-402c-4b7e-967c-eb04e3bbf918', null, 'Jules Pham',
        'Do you accept Figma files or do we need to export SVGs?', 'resolved');

commit;
