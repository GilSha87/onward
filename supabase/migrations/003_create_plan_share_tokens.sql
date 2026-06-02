-- Migration: 003_create_plan_share_tokens.sql  (ADAPTED to this project's schema)
-- Purpose: Editable onboarding-plan milestones + a secure public share/approval flow.
-- The client visits /plan/:token (no login). Token can be viewed many times,
-- approved once.
-- NOTE vs. the original package migration: this project has NO existing
--      `plan_milestones` table, so we CREATE it here (the original tried to ALTER it).
-- Run this in: Supabase Dashboard → SQL Editor

-- 1. Plan status + approval fields on clients
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS plan_status       TEXT         DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS plan_approved_at  TIMESTAMPTZ  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS plan_approved_by  TEXT         DEFAULT NULL; -- client name (free text)

DO $$ BEGIN
  ALTER TABLE public.clients
    ADD CONSTRAINT clients_plan_status_check
    CHECK (plan_status IN ('draft', 'sent', 'approved', 'locked'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. plan_milestones (NEW table — editable per-client plan items)
CREATE TABLE IF NOT EXISTS public.plan_milestones (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID        NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  phase       TEXT        DEFAULT '60',   -- '60' | '90' | '180'
  title       TEXT        NOT NULL,
  detail      TEXT        DEFAULT '',
  sort_order  INTEGER     DEFAULT 0,
  is_custom   BOOLEAN     DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plan_milestones_client_id ON public.plan_milestones(client_id);

-- 3. plan_share_tokens
CREATE TABLE IF NOT EXISTS public.plan_share_tokens (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  token        TEXT        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  client_id    UUID        NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  created_by   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  approved_at  TIMESTAMPTZ DEFAULT NULL,
  approved_by  TEXT        DEFAULT NULL,
  revoked_at   TIMESTAMPTZ DEFAULT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plan_share_tokens_token
  ON public.plan_share_tokens(token) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_plan_share_tokens_client_id
  ON public.plan_share_tokens(client_id);

-- 4. RLS — plan_milestones
ALTER TABLE public.plan_milestones ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "plan_milestones_owner_all" ON public.plan_milestones
    FOR ALL TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- Anon may read milestones (needed by the public /plan/:token page)
DO $$ BEGIN
  CREATE POLICY "plan_milestones_anon_read" ON public.plan_milestones
    FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. RLS — plan_share_tokens
ALTER TABLE public.plan_share_tokens ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "plan_share_tokens_owner_all" ON public.plan_share_tokens
    FOR ALL TO authenticated
    USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- Anon may read a live token (to load the plan)
DO $$ BEGIN
  CREATE POLICY "plan_share_tokens_anon_read" ON public.plan_share_tokens
    FOR SELECT TO anon
    USING (revoked_at IS NULL AND expires_at > NOW());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- Anon may approve once
DO $$ BEGIN
  CREATE POLICY "plan_share_tokens_anon_approve" ON public.plan_share_tokens
    FOR UPDATE TO anon
    USING (revoked_at IS NULL AND expires_at > NOW() AND approved_at IS NULL)
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. Allow anon to read the single client referenced by a live token, and to
--    mark its plan approved. (Public approval page needs the client name + write.)
DO $$ BEGIN
  CREATE POLICY "clients_anon_read_shared" ON public.clients
    FOR SELECT TO anon
    USING (EXISTS (
      SELECT 1 FROM public.plan_share_tokens t
      WHERE t.client_id = clients.id AND t.revoked_at IS NULL AND t.expires_at > NOW()
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "clients_anon_approve" ON public.clients
    FOR UPDATE TO anon
    USING (EXISTS (
      SELECT 1 FROM public.plan_share_tokens t
      WHERE t.client_id = clients.id AND t.revoked_at IS NULL
        AND t.expires_at > NOW() AND t.approved_at IS NULL
    ))
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 7. Verify:
-- SELECT token, client_id, expires_at, approved_at FROM public.plan_share_tokens LIMIT 5;
-- SELECT plan_status, plan_approved_at, plan_approved_by FROM public.clients LIMIT 5;
