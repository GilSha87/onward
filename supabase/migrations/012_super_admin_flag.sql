-- Migration 012: Super-admin capability flag (UI role simulation only)
--
-- Adds an ORTHOGONAL `is_super_admin` boolean to team_members. This is NOT a
-- fourth role: the functional role stays one of Staff/Executive/Admin. The flag
-- is read by the client ONLY to reveal the "View as" role switcher, which lets a
-- super admin visually QA how each functional role experiences the UI.
--
-- CRITICAL: This flag must NEVER widen server-side access. No RLS policy,
-- helper, or trigger references is_super_admin. RLS still sees the real
-- identity and real role. Simulation is pure client state (see
-- src/lib/RoleSimulationContext.jsx) and writes nothing to the DB.
--
-- Additive and idempotent: safe to re-run; behavior for every existing user is
-- unchanged (default false).

begin;

-- Orthogonal capability flag, defaulting to false for everyone.
alter table public.team_members
  add column if not exists is_super_admin boolean not null default false;

-- Grant to Gil only. team_members.email is UNIQUE, so this targets one row.
update public.team_members
  set is_super_admin = true
  where email = 'gil.shalom@duda.co';

-- Optional sanity check: confirm exactly one super admin was granted.
--   select email, role, is_super_admin
--   from public.team_members
--   where is_super_admin = true;

commit;
