-- Migration 015: Client activity feed (real, live)
--
-- Replaces the static "Sample" activity rail with a real per-client feed.
-- Events are written by SECURITY DEFINER triggers on the source tables (steps,
-- account_files, questions, clients), so every change is captured — including
-- direct API writes — without instrumenting each app code path.
--
-- Safety: each trigger wraps its insert in an exception handler so activity
-- logging can NEVER block or fail the underlying business write.

begin;

create table if not exists public.activity_log (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  actor       uuid references auth.users(id),   -- null for system/anon (e.g. client approval)
  kind        text not null,                    -- step_completed | step_reopened | file_uploaded | question_opened | question_resolved | plan_approved
  summary     text not null,                    -- human-readable, ready to render
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists activity_log_client_idx
  on public.activity_log(client_id, created_at desc);

alter table public.activity_log enable row level security;

-- Org-wide read for any authenticated user. No write policies: only the
-- SECURITY DEFINER triggers below insert here, so the log cannot be forged.
drop policy if exists "activity_select" on public.activity_log;
create policy "activity_select" on public.activity_log
  for select using (auth.uid() is not null);

-- Resolve the acting teammate's display name (falls back gracefully).
create or replace function public.activity_actor_name()
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select name from public.team_members where user_id = auth.uid() limit 1), 'A teammate');
$$;

-- steps: completion / reopen
create or replace function public.log_step_activity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'done' then
      insert into public.activity_log(client_id, actor, kind, summary, meta)
      values (new.client_id, auth.uid(), 'step_completed',
              public.activity_actor_name() || ' completed “' || coalesce(new.title, 'a step') || '”',
              jsonb_build_object('step_id', new.id));
    elsif old.status = 'done' then
      insert into public.activity_log(client_id, actor, kind, summary, meta)
      values (new.client_id, auth.uid(), 'step_reopened',
              public.activity_actor_name() || ' reopened “' || coalesce(new.title, 'a step') || '”',
              jsonb_build_object('step_id', new.id));
    end if;
  end if;
  return new;
exception when others then
  return new;  -- never block a step write on logging failure
end; $$;
drop trigger if exists trg_log_step_activity on public.steps;
create trigger trg_log_step_activity after update on public.steps
  for each row execute function public.log_step_activity();

-- account_files: upload
create or replace function public.log_file_activity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.activity_log(client_id, actor, kind, summary, meta)
  values (new.client_id, auth.uid(), 'file_uploaded',
          public.activity_actor_name() || ' uploaded “' || coalesce(new.title, new.file_name, 'a file') || '”',
          jsonb_build_object('file_id', new.id));
  return new;
exception when others then
  return new;
end; $$;
drop trigger if exists trg_log_file_activity on public.account_files;
create trigger trg_log_file_activity after insert on public.account_files
  for each row execute function public.log_file_activity();

-- questions: opened / resolved
create or replace function public.log_question_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.activity_log(client_id, actor, kind, summary, meta)
  values (new.client_id, auth.uid(), 'question_opened',
          'New question from ' || coalesce(new.author, 'a client'),
          jsonb_build_object('question_id', new.id));
  return new;
exception when others then
  return new;
end; $$;
drop trigger if exists trg_log_question_insert on public.questions;
create trigger trg_log_question_insert after insert on public.questions
  for each row execute function public.log_question_insert();

create or replace function public.log_question_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'resolved' and old.status is distinct from 'resolved' then
    insert into public.activity_log(client_id, actor, kind, summary, meta)
    values (new.client_id, auth.uid(), 'question_resolved',
            public.activity_actor_name() || ' resolved a question',
            jsonb_build_object('question_id', new.id));
  end if;
  return new;
exception when others then
  return new;
end; $$;
drop trigger if exists trg_log_question_update on public.questions;
create trigger trg_log_question_update after update on public.questions
  for each row execute function public.log_question_update();

-- clients: plan approved (fires only on the approved transition)
create or replace function public.log_client_activity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.plan_status = 'approved' and old.plan_status is distinct from 'approved' then
    insert into public.activity_log(client_id, actor, kind, summary, meta)
    values (new.id, auth.uid(), 'plan_approved',
            'Plan approved' || coalesce(' by ' || new.plan_approved_by, ''),
            '{}'::jsonb);
  end if;
  return new;
exception when others then
  return new;
end; $$;
drop trigger if exists trg_log_client_activity on public.clients;
create trigger trg_log_client_activity after update on public.clients
  for each row execute function public.log_client_activity();

-- Backfill from existing time-stamped sources so the feed isn't empty on day 1.
-- (Steps have no status-change timestamp, so they're only captured going forward.)
insert into public.activity_log(client_id, actor, kind, summary, meta, created_at)
select f.client_id, f.uploaded_by, 'file_uploaded',
       'Uploaded “' || coalesce(f.title, f.file_name, 'a file') || '”',
       jsonb_build_object('file_id', f.id), f.created_at
from public.account_files f
where f.deleted_at is null;

insert into public.activity_log(client_id, actor, kind, summary, meta, created_at)
select q.client_id, null, 'question_opened',
       'New question from ' || coalesce(q.author, 'a client'),
       jsonb_build_object('question_id', q.id), q.created_at
from public.questions q;

commit;
