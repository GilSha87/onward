-- 007_clients_url_nullable.sql
-- Repair: the live `clients` table has a legacy `url` column left over from an
-- earlier schema. It is NOT NULL with no default, but the application never
-- writes it (see src/lib/dbMapper.js -> clientToDbRow). Every client insert
-- therefore fails with Postgres error 23502:
--   null value in column "url" of relation "clients" violates not-null constraint
--
-- Fix is additive / non-destructive: drop the NOT NULL constraint so inserts
-- that omit `url` succeed. The column itself is preserved to avoid data loss.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'clients'
      AND column_name  = 'url'
  ) THEN
    ALTER TABLE public.clients ALTER COLUMN url DROP NOT NULL;
  END IF;
END $$;
