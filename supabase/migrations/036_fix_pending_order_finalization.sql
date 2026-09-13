-- 036_fix_pending_order_finalization.sql
-- Root-cause fixes for orders stuck at 'pending' after the customer paid:
--
--  1. `payments.updated_at` and `orders.updated_at` were referenced by
--     fail_pesapal_payment() but never created. Any call to the fail RPC
--     threw "column ... does not exist", so payments that should have been
--     marked `failed` stayed `pending` forever.
--
--  2. finalize_pesapal_payment() / fail_pesapal_payment() authorization
--     depended on the session GUC `app.api_key` being set inline (migration
--     028). The server routes call these RPCs directly without that GUC, so
--     whenever the 028 fix is not present the finalize call throws
--     "Only admins or internal processes can finalize payments" and a paid
--     order stays pending with no download token.
--     Fix: also authorize via the PostgREST JWT role claim
--     (`request.jwt.claim.role` = 'service_role'), which is session-
--     independent and always present for the service-role admin client.
--
--  3. increment_creator_balance() is recreated with the canonical bigint
--     signature so finalize can always credit earnings.

BEGIN;

-- ============================================================
-- 1. Add the missing updated_at columns (IF NOT EXISTS is safe
--    whether or not earlier migrations added them manually).
-- ============================================================
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ============================================================
-- 2. Recreate increment_creator_balance with the bigint signature
--    used by finalize_pesapal_payment (orders.creator_earnings is bigint).
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_creator_balance(creator_row_id uuid, amount bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.creators
  SET available_balance = available_balance + amount,
      total_earnings = total_earnings + amount,
      updated_at = now()
  WHERE id = creator_row_id;
END;
$$;

-- ============================================================
-- 3. finalize_pesapal_payment with session-independent auth,
--    explicit payment-status gates and updated_at on both tables.
-- ============================================================
DROP FUNCTION IF EXISTS public.finalize_pesapal_payment(text, text, jsonb);
DROP FUNCTION IF EXISTS public.finalize_pesapal_payment(text, text, jsonb, text);

CREATE OR REPLACE FUNCTION public.finalize_pesapal_payment(
  payment_reference text,
  pesapal_tracking_id text,
  status_payload jsonb DEFAULT '{}'::jsonb,
  payment_currency text DEFAULT 'UGX'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment_id uuid;
  v_order_id uuid;
  v_payment_status text;
  v_order_status text;
  v_creator_id uuid;
  v_creator_earnings bigint;
  v_product_id uuid;
  v_download_token text;
BEGIN
  -- Retained for backward compatibility with callers that set the GUC
  -- separately (migration 028 behaviour). Not strictly required anymore.
  PERFORM set_config('app.api_key', 'verified', true);

  IF NOT (
    public.is_admin()
    OR current_setting('app.api_key', true) = 'verified'
    OR current_setting('request.jwt.claim.role', true) IN ('service_role', 'supabase_admin')
  ) THEN
    RAISE EXCEPTION 'Only admins or internal processes can finalize payments';
  END IF;

  -- Lock the payment row so concurrent IPNs / confirms cannot double-credit.
  SELECT p.id, p.order_id, p.status
    INTO v_payment_id, v_order_id, v_payment_status
  FROM public.payments p
  WHERE p.merchant_reference = payment_reference
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Payment not found');
  END IF;

  -- Already finalized → return the existing download token (idempotent).
  IF v_payment_status = 'completed' THEN
    SELECT token INTO v_download_token
    FROM public.downloads
    WHERE order_id = v_order_id
    LIMIT 1;

    RETURN jsonb_build_object(
      'ok', true,
      'already_processed', true,
      'download_token', v_download_token,
      'order_id', v_order_id
    );
  END IF;

  -- Lock the order row.
  SELECT o.status, o.creator_id, o.creator_earnings, o.product_id
    INTO v_order_status, v_creator_id, v_creator_earnings, v_product_id
  FROM public.orders o
  WHERE o.id = v_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Order not found');
  END IF;

  IF v_order_status = 'paid' THEN
    SELECT token INTO v_download_token
    FROM public.downloads
    WHERE order_id = v_order_id
    LIMIT 1;

    RETURN jsonb_build_object(
      'ok', true,
      'already_processed', true,
      'download_token', v_download_token,
      'order_id', v_order_id
    );
  END IF;

  -- Transition both rows atomically.
  UPDATE public.payments
  SET status = 'completed',
      tracking_id = pesapal_tracking_id,
      verified_at = now(),
      raw_payload = status_payload,
      updated_at = now()
  WHERE id = v_payment_id;

  UPDATE public.orders
  SET status = 'paid',
      paid_at = now(),
      currency = COALESCE(payment_currency, currency),
      updated_at = now()
  WHERE id = v_order_id;

  PERFORM public.increment_creator_balance(v_creator_id, v_creator_earnings);

  INSERT INTO public.downloads (order_id, product_id, token, expires_at)
  VALUES (v_order_id, v_product_id, gen_random_uuid(), now() + interval '7 days')
  ON CONFLICT (order_id) DO UPDATE
    SET token = EXCLUDED.token,
        expires_at = EXCLUDED.expires_at,
        downloaded_at = NULL
  RETURNING token INTO v_download_token;

  RETURN jsonb_build_object(
    'ok', true,
    'already_processed', false,
    'download_token', v_download_token,
    'order_id', v_order_id,
    'currency', payment_currency
  );
END;
$$;

-- ============================================================
-- 4. fail_pesapal_payment with the same session-independent auth,
--    safe against the missing-column bug.
-- ============================================================
CREATE OR REPLACE FUNCTION public.fail_pesapal_payment(
  payment_merchant_reference text,
  failure_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment_id uuid;
  v_order_id uuid;
BEGIN
  PERFORM set_config('app.api_key', 'verified', true);

  IF NOT (
    public.is_admin()
    OR current_setting('app.api_key', true) = 'verified'
    OR current_setting('request.jwt.claim.role', true) IN ('service_role', 'supabase_admin')
  ) THEN
    RAISE EXCEPTION 'Only admins or internal processes can modify payment status';
  END IF;

  SELECT p.id, p.order_id
    INTO v_payment_id, v_order_id
  FROM public.payments p
  WHERE p.merchant_reference = payment_merchant_reference
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found for reference: %', payment_merchant_reference;
  END IF;

  UPDATE public.payments
  SET status = 'failed',
      raw_payload = failure_payload,
      updated_at = now()
  WHERE id = v_payment_id;

  UPDATE public.orders
  SET status = 'failed', updated_at = now()
  WHERE id = v_order_id AND status = 'pending';
END;
$$;

COMMIT;