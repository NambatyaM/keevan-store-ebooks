-- 012_hotfix_finalize_pesapal.sql
-- Fixes two bugs in finalize_pesapal_payment() from 011:
--   1. already_processed returns false for already-completed payments (should be true)
--   2. ON CONFLICT ... DO UPDATE references updated_at on downloads which doesn't exist

CREATE OR REPLACE FUNCTION public.finalize_pesapal_payment(
  payment_reference text,
  pesapal_tracking_id text,
  status_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  download_token text,
  already_processed boolean,
  order_id uuid,
  product_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment public.payments;
  v_order_amount bigint;
  v_order_product_id uuid;
  v_order_creator_id uuid;
  v_download public.downloads;
  v_commission_rate numeric;
BEGIN
  IF NOT public.is_admin() AND current_setting('app.api_key', true) <> 'verified' THEN
    RAISE EXCEPTION 'Only admins or internal processes can finalize payments';
  END IF;

  SELECT p.* INTO v_payment
  FROM public.payments p
  JOIN public.orders o ON o.id = p.order_id
  WHERE p.merchant_reference = payment_reference
  FOR UPDATE OF p;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found for reference: %', payment_reference;
  END IF;

  SELECT o.amount, o.product_id, o.creator_id
  INTO v_order_amount, v_order_product_id, v_order_creator_id
  FROM public.orders o
  WHERE o.id = v_payment.order_id;

  IF v_payment.status = 'completed' THEN
    SELECT * INTO v_download
    FROM public.downloads d
    WHERE d.order_id = v_payment.order_id;

    IF FOUND THEN
      RETURN QUERY SELECT
        v_download.token::text,
        true,
        v_payment.order_id,
        v_download.product_id;
    END IF;
    RETURN;
  END IF;

  UPDATE public.payments
  SET status = 'completed',
      tracking_id = COALESCE(pesapal_tracking_id, tracking_id),
      raw_payload = status_payload,
      verified_at = now()
  WHERE id = v_payment.id;

  UPDATE public.orders
  SET status = 'paid', paid_at = now(), updated_at = now()
  WHERE id = v_payment.order_id AND status <> 'paid';

  SELECT COALESCE(c.value::numeric, 0.1) INTO v_commission_rate
  FROM public.platform_config c WHERE c.key = 'commission_rate';

  UPDATE public.orders
  SET platform_fee = ROUND(v_order_amount * v_commission_rate),
      creator_earnings = v_order_amount - ROUND(v_order_amount * v_commission_rate),
      updated_at = now()
  WHERE id = v_payment.order_id;

  PERFORM public.increment_creator_balance(v_order_creator_id, v_order_amount - ROUND(v_order_amount * v_commission_rate));

  INSERT INTO public.downloads (order_id, product_id, token, expires_at)
  VALUES (v_payment.order_id, v_order_product_id, gen_random_uuid(), now() + interval '7 days')
  ON CONFLICT (order_id) DO UPDATE SET token = EXCLUDED.token, expires_at = EXCLUDED.expires_at, downloaded_at = null
  RETURNING * INTO v_download;

  RETURN QUERY SELECT
    v_download.token::text,
    false,
    v_payment.order_id,
    v_download.product_id;
END;
$$;
