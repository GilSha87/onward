-- Migration: 002_create_account_files.sql
-- Purpose: File uploads per client account. Metadata in Postgres; bytes in
--          Supabase Storage bucket 'account-files' (private, signed URLs).
-- NOTE: RLS here is scoped to the uploader (auth.uid() = uploaded_by) to match
--       this project's existing per-user (per-AM) security model on clients/steps.
-- Run this in: Supabase Dashboard → SQL Editor

-- 1. Table
CREATE TABLE IF NOT EXISTS public.account_files (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID        NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  uploaded_by   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT        NOT NULL,
  file_type     TEXT        NOT NULL DEFAULT 'Other',
  storage_path  TEXT        NOT NULL,   -- path inside the 'account-files' bucket
  file_name     TEXT        NOT NULL,   -- original filename
  file_size     BIGINT,                 -- bytes
  mime_type     TEXT,
  deleted_at    TIMESTAMPTZ DEFAULT NULL, -- soft delete
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. file_type allowed list
DO $$ BEGIN
  ALTER TABLE public.account_files
    ADD CONSTRAINT account_files_type_check
    CHECK (file_type IN (
      'Commercial Proposal','Contract','SOW','Onboarding Plan','Training Material','Other'
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. max file size 25MB
DO $$ BEGIN
  ALTER TABLE public.account_files
    ADD CONSTRAINT account_files_size_limit
    CHECK (file_size IS NULL OR file_size <= 26214400);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_account_files_client_id
  ON public.account_files(client_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_account_files_uploaded_by
  ON public.account_files(uploaded_by);

-- 5. RLS — uploader-scoped (matches clients/steps model)
ALTER TABLE public.account_files ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "account_files_select" ON public.account_files
    FOR SELECT TO authenticated
    USING (auth.uid() = uploaded_by AND deleted_at IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "account_files_insert" ON public.account_files
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = uploaded_by);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "account_files_update" ON public.account_files
    FOR UPDATE TO authenticated
    USING (auth.uid() = uploaded_by) WITH CHECK (auth.uid() = uploaded_by);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. Storage bucket setup (do this in Storage UI AFTER running this migration):
--    Name: account-files | Public: OFF | Size limit: 26214400 (25MB)
--    MIME allowlist: application/pdf,
--      application/vnd.openxmlformats-officedocument.wordprocessingml.document,
--      application/vnd.openxmlformats-officedocument.presentationml.presentation,
--      application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,
--      image/png, image/jpeg
-- Then run these Storage RLS policies (uploader-scoped via path prefix = uid):
/*
CREATE POLICY "account_files_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'account-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "account_files_storage_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'account-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "account_files_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'account-files' AND (storage.foldername(name))[1] = auth.uid()::text);
*/

-- 7. Verify: SELECT * FROM public.account_files LIMIT 5;
