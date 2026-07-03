-- Migration: Inline set_config into finalize_pesapal_payment
-- Date: 2026-07-03
-- 
-- Problem: set_app_api_key() and finalize_pesapal_payment() were called as
-- separate RPCs. Since set_config('app.api_key', 'verified', true) is session-
-- local, and PostgREST may route the two requests to different pooled
-- connections, the auth check in finalize_pesapal_payment would fail with:
--   "Only admins or internal processes can finalize payments"
--
-- Fix: Call set_config directly inside finalize_pesapal_payment before the
-- auth check, ensuring the setting is always present in the same session.
-- The separate set_app_api_key() function is kept for backward compatibility
-- but no longer needs to be called by server-side routes.

BEGIN;

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
  v_order_status text;
  v_creator_id uuid;
  v_creator_earnings bigint;
  v_product_id uuid;
  v_download_token text;
BEGIN
  -- Ensure app.api_key is set in the current session for the auth check below.
  -- This is REQUIRED because set_config is session-local: if set_app_api_key()
  -- was called in a separate RPC, a different pool connection may not have it.
  PERFORM set_config('app.api_key', 'verified', true);

  IF NOT public.is_admin() AND current_setting('app.api_key', true) <> 'verified' THEN
    RAISE EXCEPTION 'Only admins or internal processes can finalize payments';
  END IF;

  -- Lock and read payment row
  SELECT p.id, p.order_id, p.status
    INTO v_payment_id, v_order_id, v_order_status
  FROM public.payments p
  WHERE p.merchant_reference = payment_reference
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Payment not found');
  END IF;

  -- Idempotency: already finalized
  IF v_order_status = 'completed' THEN
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

  -- Lock and read order row
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

  -- Update payment and order atomically
  UPDATE public.payments
  SET status = 'completed',
      tracking_id = pesapal_tracking_id,
      verified_at = now(),
      raw_payload = status_payload
  WHERE id = v_payment_id;

  UPDATE public.orders
  SET status = 'paid',
      paid_at = now(),
      currency = COALESCE(payment_currency, currency)
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

COMMIT;
