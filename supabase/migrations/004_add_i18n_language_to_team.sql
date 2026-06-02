-- Migration: 004_add_i18n_language_to_team.sql  (ADAPTED / OPTIONAL)
-- Purpose: Optionally persist the AM's preferred UI language to the database.
--
-- NOTE: This project's frontend persists language to localStorage (key:
-- 'onward_lang'), which works in demo mode and production. This migration is
-- OPTIONAL — run it only if you have (or want) a `team` table to also store the
-- preference server-side. It is written defensively so it will NOT error if the
-- `team` table does not exist.
-- Run this in: Supabase Dashboard → SQL Editor

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'team'
  ) THEN
    ALTER TABLE public.team
      ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';

    BEGIN
      ALTER TABLE public.team
        ADD CONSTRAINT team_language_check
        CHECK (preferred_language IN ('en','he','nl','es','de','fr','pt'));
    EXCEPTION WHEN duplicate_object THEN NULL; END;

    RAISE NOTICE 'team.preferred_language added.';
  ELSE
    RAISE NOTICE 'No public.team table — skipping. Language persists via localStorage in the app.';
  END IF;
END $$;

-- Verify (if team table exists):
-- SELECT id, preferred_language FROM public.team LIMIT 5;
