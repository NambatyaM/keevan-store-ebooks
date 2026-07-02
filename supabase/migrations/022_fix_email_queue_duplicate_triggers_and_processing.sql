-- 022_fix_email_queue_duplicate_triggers_and_processing.sql
-- ============================================================
-- 1. Add 'processing' status to email_status enum
-- 2. Fix duplicate withdrawal status emails (CRITICAL)
-- 3. Add atomic claim function for race-condition-free processing
-- 4. Add composite index for retry_count filtering
-- ============================================================

-- ============================================================
-- PART 1: Add 'processing' status to email_status enum
-- ============================================================
ALTER TYPE public.email_status ADD VALUE IF NOT EXISTS 'processing';

-- ============================================================
-- PART 2: Drop duplicate withdrawal status trigger
-- ============================================================
-- After 019, notify_withdrawal_status_change() inserts into
-- email_queue. trg_enqueue_withdrawal_status (from 010) also
-- fires on the same UPDATE OF status, causing duplicate emails.
-- Drop the redundant trigger and its now-unused function.
DROP TRIGGER IF EXISTS trg_enqueue_withdrawal_status ON public.withdrawal_requests;
DROP FUNCTION IF EXISTS public.enqueue_withdrawal_status_email();

-- ============================================================
-- PART 2: Atomic claim function for email queue
-- ============================================================
-- Prevents race-condition duplicate sends when multiple cron
-- invocations overlap. Atomically claims pending items using
-- FOR UPDATE SKIP LOCKED so each item is processed exactly once.
CREATE OR REPLACE FUNCTION public.claim_email_queue_items(
  p_limit int DEFAULT 100
)
RETURNS SETOF public.email_queue
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.email_queue
  SET status = 'processing',
      updated_at = now()
  WHERE id IN (
    SELECT id FROM public.email_queue
    WHERE status = 'pending'
      AND retry_count < 3
    ORDER BY created_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
END;
$$;

-- ============================================================
-- PART 3: Composite index for retry_count filtering
-- ============================================================
-- The cron query filters on status = 'pending' AND retry_count < 3.
-- The existing partial index only covers (status, created_at).
-- This index adds retry_count to avoid a sequential scan on pending items.
CREATE INDEX IF NOT EXISTS idx_email_queue_pending_retry
  ON public.email_queue (status, retry_count, created_at)
  WHERE status = 'pending' AND retry_count < 3;

-- ============================================================
-- PART 4: Reindex to ensure all indexes are up to date
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_email_queue_status') THEN
    REINDEX INDEX idx_email_queue_status;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_email_queue_pending_retry') THEN
    REINDEX INDEX idx_email_queue_pending_retry;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_email_queue_created_at') THEN
    REINDEX INDEX idx_email_queue_created_at;
  END IF;
END $$;
