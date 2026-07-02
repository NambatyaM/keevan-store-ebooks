-- 025_cleanup_orphan_rpc_overloads.sql
-- Safety cleanup: drop any leftover overloads of finalize_pesapal_payment
-- from earlier versions (migrations 002-016) that may remain if any
-- migration was partially applied.
--
-- The canonical version (017) uses 4 params and returns jsonb.
-- We drop all overloads, then recreate to ensure a single consistent version.

BEGIN;

-- Drop all overloads to reset state
DROP FUNCTION IF EXISTS public.finalize_pesapal_payment(text, text, jsonb);
DROP FUNCTION IF EXISTS public.finalize_pesapal_payment(text, text, jsonb, text);

-- Recreate the canonical version from 017
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
  IF NOT public.is_admin() AND current_setting('app.api_key', true) <> 'verified' THEN
    RAISE EXCEPTION 'Only admins or internal processes can finalize payments';
  END IF;

  SELECT p.id, p.order_id, p.status
    INTO v_payment_id, v_order_id, v_order_status
  FROM public.payments p
  WHERE p.merchant_reference = payment_reference
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Payment not found');
  END IF;

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
