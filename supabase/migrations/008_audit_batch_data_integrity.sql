-- Migration 008: Audit-batch data integrity
-- Batch 1: phase normalization, mono fix, orphan cleanup, FK cascade, progress trigger
-- Run as a single transaction so it rolls back fully on any error.

begin;

-- ============================================================
-- 1.2  Normalize clients.phase to the enum format
-- ============================================================
update public.clients set phase = 'pre' where phase in ('Phase 00', 'Phase 0', 'phase 00', 'Phase00');
update public.clients set phase = 'p1'  where phase ilike 'phase 1%';
update public.clients set phase = 'p2'  where phase ilike 'phase 2%';
update public.clients set phase = 'p3'  where phase ilike 'phase 3%';
update public.clients set phase = 'p4'  where phase ilike 'phase 4%';
-- Catch any remaining unknowns (safe fallback)
update public.clients set phase = 'pre'
  where phase not in ('pre','p1','p2','p3','p4');

-- Add CHECK constraint so this can't drift again
alter table public.clients
  drop constraint if exists clients_phase_enum;
alter table public.clients
  add constraint clients_phase_enum
  check (phase in ('pre','p1','p2','p3','p4'));

-- ============================================================
-- 1.3  Fix mono storing a hex color instead of initials
-- ============================================================
update public.clients
set mono = upper(
  left(split_part(name, ' ', 1), 1) ||
  coalesce(nullif(left(split_part(name, ' ', 2), 1), ''), '')
)
where mono is null or mono = '#000' or mono ~ '^#';

-- ============================================================
-- 1.4  Remove orphaned steps and add FK cascade
-- ============================================================

-- Clean existing orphans
delete from public.steps s
where not exists (select 1 from public.clients c where c.id = s.client_id);

-- Re-add FK with ON DELETE CASCADE (drop first in case it exists without cascade)
alter table public.steps
  drop constraint if exists steps_client_id_fkey;
alter table public.steps
  add constraint steps_client_id_fkey
  foreign key (client_id) references public.clients(id) on delete cascade;

-- ============================================================
-- 4.1  progress_total trigger (keep it in sync with step count)
-- ============================================================
create or replace function public.recalc_progress_total()
returns trigger language plpgsql as $$
begin
  update public.clients c
  set progress_total = (select count(*) from public.steps s where s.client_id = c.id)
  where c.id = coalesce(new.client_id, old.client_id);
  return null;
end $$;

drop trigger if exists trg_recalc_progress_total on public.steps;
create trigger trg_recalc_progress_total
  after insert or delete or update of client_id on public.steps
  for each row execute function public.recalc_progress_total();

-- One-time backfill of progress_total for all clients
update public.clients c
set progress_total = (select count(*) from public.steps s where s.client_id = c.id);

-- ============================================================
-- Verify (these selects are informational; won't fail the migration)
-- ============================================================
-- select distinct phase from public.clients order by 1;
-- select id, name, mono, phase, progress_total from public.clients;

commit;
