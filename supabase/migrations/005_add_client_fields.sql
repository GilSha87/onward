-- Add logo URL, CRM fields, and go-live date to clients table
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS logo_url     TEXT,
  ADD COLUMN IF NOT EXISTS sf_id        TEXT,
  ADD COLUMN IF NOT EXISTS box_url      TEXT,
  ADD COLUMN IF NOT EXISTS go_live_date DATE;
