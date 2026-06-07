-- Migration 010: Three-role access model (Executive / Admin / Staff)
-- Enforces the permission matrix server-side via RLS so UI gating cannot be
-- bypassed by direct API calls. Roles live in team_members.role (capitalized).
--
-- Decisions baked in (confirmed with product):
--   * Org-wide visibility: every authenticated team member can READ all clients
--     and steps. Writes are gated by role.
--   * clients/steps create + edit: Staff and Admin. Executive is read-only.
--   * archive / soft-delete / hard-delete: Admin only.
--   * role changes, user add/remove, audit reads: Admin (audit also Executive).
--   * Last-admin lockout protection + access audit log enforced at the DB layer.
--
-- Run as a single transaction so it rolls back fully on any error.

begin;

-- ============================================================
-- 0. Constrain the role column to the three canonical values
-- ============================================================
-- Normalize any stray values first so the constraint can be added cleanly.
update public.team_members set role = 'Staff'
  where role is null or role not in ('Staff', 'Executive', 'Admin');

alter table public.team_members drop constraint if exists team_members_role_check;
alter table public.team_members
  add constraint team_members_role_check
  check (role in ('Staff', 'Executive', 'Admin'));

-- ============================================================
-- 1. Current-user role helper
-- ============================================================
-- SECURITY DEFINER so it bypasses RLS on team_members (prevents recursion when
-- referenced inside team_members' own policies). Falls back to 'Staff' for an
-- authenticated user without a team row — admin actions still require a real
-- Admin row, so this only grants baseline org-member access.
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.team_members where user_id = auth.uid() limit 1),
    'Staff'
  );
$$;

-- ============================================================
-- 2. Clients — org-wide read, role-gated write
-- ============================================================
drop policy if exists "clients_select" on public.clients;
drop policy if exists "clients_insert" on public.clients;
drop policy if exists "clients_update" on public.clients;
drop policy if exists "clients_delete" on public.clients;

-- Any authenticated user may view all clients.
create policy "clients_select" on public.clients
  for select using (auth.uid() is not null);

-- Staff + Admin may create clients.
create policy "clients_insert" on public.clients
  for insert with check (public.current_user_role() in ('Staff', 'Admin'));

-- Staff + Admin may edit; only Admin may set archived/deleted status.
create policy "clients_update" on public.clients
  for update
  using (public.current_user_role() in ('Staff', 'Admin'))
  with check (
    public.current_user_role() = 'Admin'
    or (public.current_user_role() = 'Staff' and status not in ('archived', 'deleted'))
  );

-- Only Admin may hard-delete client rows.
create policy "clients_delete" on public.clients
  for delete using (public.current_user_role() = 'Admin');

-- ============================================================
-- 3. Steps — org-wide read, Staff/Admin write
-- ============================================================
drop policy if exists "steps_select" on public.steps;
drop policy if exists "steps_insert" on public.steps;
drop policy if exists "steps_update" on public.steps;
drop policy if exists "steps_delete" on public.steps;

create policy "steps_select" on public.steps
  for select using (auth.uid() is not null);
create policy "steps_insert" on public.steps
  for insert with check (public.current_user_role() in ('Staff', 'Admin'));
create policy "steps_update" on public.steps
  for update
  using (public.current_user_role() in ('Staff', 'Admin'))
  with check (public.current_user_role() in ('Staff', 'Admin'));
create policy "steps_delete" on public.steps
  for delete using (public.current_user_role() in ('Staff', 'Admin'));

-- ============================================================
-- 4. Team members — Admin manages users & roles
-- ============================================================
-- SELECT stays open to any authenticated user (existing policy "team_select").
drop policy if exists "team_insert" on public.team_members;
drop policy if exists "team_update" on public.team_members;
drop policy if exists "team_delete" on public.team_members;

-- Only Admin may add members directly. (The invite Edge Function uses the
-- service-role key and bypasses RLS, so invites continue to work.)
create policy "team_insert" on public.team_members
  for insert with check (public.current_user_role() = 'Admin');

-- A member may update their own row; Admin may update anyone. Changing the
-- role column itself is further restricted by the trigger below.
create policy "team_update" on public.team_members
  for update
  using (public.current_user_role() = 'Admin' or auth.uid() = user_id)
  with check (public.current_user_role() = 'Admin' or auth.uid() = user_id);

-- Only Admin may remove members.
create policy "team_delete" on public.team_members
  for delete using (public.current_user_role() = 'Admin');

-- ============================================================
-- 5. Role-change guard — only Admin may change a role; protect last Admin
-- ============================================================
create or replace function public.guard_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_count integer;
begin
  if tg_op = 'UPDATE' and new.role is distinct from old.role then
    if public.current_user_role() <> 'Admin' then
      raise exception 'Only an Admin may change a member''s role';
    end if;
  end if;

  -- Last-admin protection: block demoting or deleting the final Admin.
  if (tg_op = 'UPDATE' and old.role = 'Admin' and new.role <> 'Admin')
     or (tg_op = 'DELETE' and old.role = 'Admin') then
    select count(*) into admin_count from public.team_members where role = 'Admin';
    if admin_count <= 1 then
      raise exception 'Cannot remove or demote the last remaining Admin';
    end if;
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_role_change on public.team_members;
create trigger trg_guard_role_change
  before update or delete on public.team_members
  for each row execute function public.guard_role_change();

-- ============================================================
-- 6. Access audit log
-- ============================================================
create table if not exists public.access_audit_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,        -- whose role changed
  old_role    text,
  new_role    text not null,
  changed_by  uuid not null,        -- who made the change
  changed_at  timestamptz not null default now()
);

alter table public.access_audit_log enable row level security;

-- Readable by audit.view holders (Executive + Admin). No client writes — only
-- the trigger writes, via SECURITY DEFINER, so the log cannot be tampered with.
drop policy if exists "audit_select" on public.access_audit_log;
create policy "audit_select" on public.access_audit_log
  for select using (public.current_user_role() in ('Executive', 'Admin'));

create or replace function public.log_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    insert into public.access_audit_log (user_id, old_role, new_role, changed_by)
    values (new.user_id, old.role, new.role, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists trg_log_role_change on public.team_members;
create trigger trg_log_role_change
  after update on public.team_members
  for each row execute function public.log_role_change();

-- ============================================================
-- 7. Post-migration assertions / seeding (manual)
-- ============================================================
-- After running, confirm at least one Admin exists. If the workspace owner has
-- no team_members row yet, create/promote them here (substitute the real id):
--
--   insert into public.team_members (user_id, name, email, role, status)
--   values ('<owner-auth-uid>', 'Owner Name', 'owner@example.com', 'Admin', 'active')
--   on conflict (email) do update set role = 'Admin';
--
-- Verify:
--   select count(*) from public.team_members where role = 'Admin';  -- must be >= 1

commit;
