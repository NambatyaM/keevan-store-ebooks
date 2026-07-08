-- 030_fix_reserve_withdrawal_auth_uid.sql
-- Fixes: reserve_withdrawal uses auth.uid() which returns NULL when called
-- via the service_role admin client (getSupabaseAdminClient). This causes
-- every creator withdrawal attempt to fail with "Creator profile not found
-- for authenticated user".
--
-- Fix:
--   1. Add set_session_request_user_id() RPC that the API route calls before
--      reserve_withdrawal to propagate the authenticated user_id into the
--      session as a set_config parameter.
--   2. Update reserve_withdrawal to fall back to current_setting('app.request_user_id')
--      when auth.uid() is NULL.

-- ============================================================
-- PART 1: Helper RPC to propagate user_id to SECURITY DEFINER functions
-- SECURITY INVOKER so it runs with the caller's permissions (service_role)
-- and sets the app.request_user_id config parameter for subsequent RPCs.
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_session_request_user_id(user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
AS $$
  SELECT set_config('app.request_user_id', user_id::text, true);
$$;

-- ============================================================
-- PART 2: Fix reserve_withdrawal to fall back to session config
-- ============================================================

CREATE OR REPLACE FUNCTION public.reserve_withdrawal(
  p_amount bigint,
  p_payout_method text,
  p_payout_details jsonb DEFAULT '{}'::jsonb
)
RETURNS public.withdrawal_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_creator_row public.creators;
  v_store_row public.stores%ROWTYPE;
  v_created_request public.withdrawal_requests;
BEGIN
  -- Try auth.uid() first (anon/key auth), fall back to session config (service_role)
  v_user_id := COALESCE(auth.uid(), current_setting('app.request_user_id', true)::uuid);

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_creator_row
  FROM public.creators WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Creator profile not found for authenticated user';
  END IF;

  SELECT * INTO v_store_row
  FROM public.stores WHERE creator_id = v_creator_row.id;

  IF FOUND AND v_store_row.status = 'suspended' THEN
    RAISE EXCEPTION 'Store is suspended — withdrawals are not available';
  END IF;

  IF p_amount > v_creator_row.available_balance THEN
    RAISE EXCEPTION 'Insufficient balance — requested % but only % available', p_amount, v_creator_row.available_balance;
  END IF;

  INSERT INTO public.withdrawal_requests (creator_id, amount, payout_method, payout_details)
  VALUES (v_creator_row.id, p_amount, p_payout_method, p_payout_details)
  RETURNING * INTO v_created_request;

  UPDATE public.creators
  SET available_balance = available_balance - p_amount,
      updated_at = now()
  WHERE id = v_creator_row.id;

  RETURN v_created_request;
END;
$$;
