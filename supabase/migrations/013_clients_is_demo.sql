-- Migration 013: Demo/test client flag
--
-- Adds an `is_demo` flag to clients so QA/test rows can be hidden from the
-- portfolio and excluded from KPIs by default, without hard-deleting them
-- (which would orphan child steps/contacts/milestones/files). The client app
-- filters is_demo = false by default and offers a "Show demo accounts" toggle.
--
-- Additive and idempotent. Default false leaves every real account unchanged.

begin;

alter table public.clients
  add column if not exists is_demo boolean not null default false;

-- Flag the four known QA/test rows. Matched by primary key (verified) so an
-- em-dash / whitespace in a name can't cause a mismatch. Names for reference:
--   Probe Co, Probe Co 2, UI Verify Co, "QA TEST — delete me".
update public.clients set is_demo = true
where id in (
  '95ee1a2f-3e0d-4f58-bb13-f8022ab58a06',  -- Probe Co
  '3266cd27-50b3-490f-bd81-ff3828175b80',  -- Probe Co 2
  '278b7176-402c-4b7e-967c-eb04e3bbf918',  -- UI Verify Co
  'bbd70a06-94d2-4067-9bad-3777eecdce27'   -- QA TEST — delete me
);

-- Sanity check (manual):
--   select name, is_demo from public.clients order by created_at;

commit;
