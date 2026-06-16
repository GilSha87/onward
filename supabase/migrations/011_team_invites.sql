-- 011_team_invites.sql
-- Custom, app-controlled team invitations.
--
-- Why this exists: Supabase's built-in invite/recovery emails use ONE-TIME
-- tokens. Corporate mail systems (Outlook SafeLinks, Mimecast, Google) pre-fetch
-- every link to scan it, which consumes the one-time token before the human
-- clicks — so invitees land on a dead link and can't set a password.
--
-- This table stores our OWN invite token. Merely loading the invite page (a GET,
-- which scanners perform) does nothing; the token is only consumed when the
-- invitee actually submits their chosen password via the accept-invite edge
-- function. That makes the flow immune to link pre-fetching.

create table if not exists public.team_invites (
  token       uuid primary key default gen_random_uuid(),
  email       text not null,
  name        text not null,
  role        text not null default 'Staff',   -- 'Staff' | 'Executive' | 'Admin'
  invited_by  uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '7 days'),
  used_at     timestamptz
);

create index if not exists team_invites_email_idx on public.team_invites(email);

-- RLS is enabled with NO policies on purpose. The anon/auth data API must never
-- read or write this table directly. All access goes through edge functions that
-- use the service-role key, which bypasses RLS.
alter table public.team_invites enable row level security;
