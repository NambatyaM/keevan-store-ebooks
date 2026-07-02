-- 026_fix_fail_pesapal_for_update.sql
-- Fixes: fail_pesapal_payment() selects payment without FOR UPDATE (migration 011),
-- which can race with finalize_pesapal_payment() and allow both functions to
-- operate on the same payment row concurrently.
--
-- Adds FOR UPDATE on the payment SELECT, matching the pattern used by
-- finalize_pesapal_payment and all other guarded RPCs.

BEGIN;

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
  IF NOT public.is_admin() AND current_setting('app.api_key', true) <> 'verified' THEN
    RAISE EXCEPTION 'Only admins or internal processes can modify payment status';
  END IF;

  SELECT p.id, p.order_id INTO v_payment_id, v_order_id
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
