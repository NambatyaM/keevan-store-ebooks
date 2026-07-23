-- 033_fix_email_queue_updated_at.sql
-- Adds missing updated_at column referenced by claim_email_queue_items()

ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
