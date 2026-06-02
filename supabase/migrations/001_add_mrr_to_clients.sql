-- Migration: 001_add_mrr_to_clients.sql
-- Purpose: Add MRR (Monthly Recurring Revenue) and currency fields to clients table.
-- ARR is always calculated as MRR × 12 in the app — never stored separately.
-- Run this in: Supabase Dashboard → SQL Editor

-- 1. Add columns
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS mrr_amount   NUMERIC(12, 2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS mrr_currency TEXT           DEFAULT 'USD';

-- 2. Currency must be a known code
DO $$ BEGIN
  ALTER TABLE public.clients
    ADD CONSTRAINT clients_mrr_currency_check
    CHECK (mrr_currency IN ('USD', 'EUR', 'GBP', 'AUD', 'ILS', 'CAD', 'NZD'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. MRR must be positive if set
DO $$ BEGIN
  ALTER TABLE public.clients
    ADD CONSTRAINT clients_mrr_positive
    CHECK (mrr_amount IS NULL OR mrr_amount > 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Index for sorting/filtering by MRR on dashboard
CREATE INDEX IF NOT EXISTS idx_clients_mrr_amount ON public.clients(mrr_amount DESC NULLS LAST);

-- 5. RLS: existing user_id-scoped policies on clients cover these columns. No change needed.

-- 6. Verify:
-- SELECT id, name, mrr_amount, mrr_currency FROM public.clients LIMIT 5;
