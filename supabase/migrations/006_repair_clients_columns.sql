-- Migration: 006_repair_clients_columns.sql
-- Purpose: REPAIR the live `clients` table, which is missing the core columns
--          the app writes on insert (causing "Failed to save a client").
--
-- Diagnosis: the deployed `clients` table only had name + the later
-- migration columns (mrr/plan/logo/sf/box/go_live). The base columns from
-- schema.sql (user_id, icp, flow, touch, ...) were never applied, so
-- db.from('clients').insert(...) fails with: 42703 column does not exist.
--
-- This migration is ADDITIVE and non-destructive (IF NOT EXISTS), so it is
-- safe to run on the existing table without dropping data.
-- Run this in: Supabase Dashboard -> SQL Editor

-- 1. Add the missing columns
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS icp            TEXT,
  ADD COLUMN IF NOT EXISTS flow           TEXT,
  ADD COLUMN IF NOT EXISTS touch          TEXT,
  ADD COLUMN IF NOT EXISTS country        TEXT,
  ADD COLUMN IF NOT EXISTS flag           TEXT,
  ADD COLUMN IF NOT EXISTS lang           TEXT,
  ADD COLUMN IF NOT EXISTS color          TEXT,
  ADD COLUMN IF NOT EXISTS mono           TEXT,
  ADD COLUMN IF NOT EXISTS kickoff        TEXT,
  ADD COLUMN IF NOT EXISTS am             TEXT,
  ADD COLUMN IF NOT EXISTS day_in         INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS phase          TEXT,
  ADD COLUMN IF NOT EXISTS status         TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS contacts       JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS progress_done  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS progress_total INTEGER DEFAULT 20;

-- 2. Index on user_id (for RLS-filtered reads)
CREATE INDEX IF NOT EXISTS clients_user_id_idx ON public.clients(user_id);

-- 3. Enable RLS + per-user policies (matches schema.sql security model)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "clients_select" ON public.clients
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "clients_insert" ON public.clients
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "clients_update" ON public.clients
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "clients_delete" ON public.clients
    FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Verify the columns now exist:
-- SELECT column_name FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'clients' ORDER BY column_name;
