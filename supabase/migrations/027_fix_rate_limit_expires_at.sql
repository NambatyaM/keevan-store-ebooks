-- 027_fix_rate_limit_expires_at.sql
-- Fixes: rate_limit_check_and_increment RPC fails with
-- "column expires_at of relation rate_limits does not exist"
-- because migration 008 adding the column was never applied in production.
-- Also ensures set_app_api_key() exists for payment finalization.

-- ============================================================
-- 1. Add expires_at column to rate_limits if missing
-- ============================================================
ALTER TABLE public.rate_limits ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- ============================================================
-- 2. Add missing index for expires_at cleanup
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires_at ON public.rate_limits (expires_at)
  WHERE expires_at IS NOT NULL;

-- ============================================================
-- 3. Ensure rate_limit_check_and_increment exists with correct signature
-- (avoids stale overloads from migration 008 vs 011 mismatch)
-- ============================================================
CREATE OR REPLACE FUNCTION public.rate_limit_check_and_increment(
  p_key text,
  p_window_start text,
  p_max_requests integer,
  p_window_seconds integer DEFAULT 60
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_count integer;
BEGIN
  INSERT INTO public.rate_limits (key, count, window_start, expires_at)
  VALUES (p_key, 1, p_window_start::timestamptz, (p_window_start::timestamptz + (p_window_seconds || ' seconds')::interval))
  ON CONFLICT (key, window_start) DO UPDATE
    SET count = rate_limits.count + 1
    WHERE rate_limits.count < p_max_requests
  RETURNING count INTO v_current_count;

  IF v_current_count IS NULL THEN
    SELECT count INTO v_current_count
    FROM public.rate_limits
    WHERE key = p_key AND window_start = p_window_start::timestamptz;
  END IF;

  IF v_current_count > p_max_requests THEN
    RAISE EXCEPTION 'Rate limit exceeded';
  END IF;
END;
$$;

-- ============================================================
-- 4. Ensure set_app_api_key() exists for payment finalization
-- THIS IS CRITICAL: without it, finalize_pesapal_payment() fails auth
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_app_api_key()
RETURNS void
LANGUAGE sql
SECURITY INVOKER
AS $$
  SELECT set_config('app.api_key', 'verified', true);
$$;
