-- 016_multi_currency.sql
-- Multi-currency support: Add currency columns to all monetary tables.

-- 1. Stores — operating currency (add column then constraint)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'UGX';
ALTER TABLE stores DROP CONSTRAINT IF EXISTS valid_store_currency;
ALTER TABLE stores ADD CONSTRAINT valid_store_currency
  CHECK (currency IN ('UGX', 'KES', 'TZS', 'RWF', 'USD'));

-- 2. Products — price currency (already has currency column)
ALTER TABLE products DROP CONSTRAINT IF EXISTS valid_product_currency;
ALTER TABLE products ADD CONSTRAINT valid_product_currency
  CHECK (currency IN ('UGX', 'KES', 'TZS', 'RWF', 'USD'));

-- 3. Orders — transaction currency (existing rows default to UGX)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'UGX';
ALTER TABLE orders DROP CONSTRAINT IF EXISTS valid_order_currency;
ALTER TABLE orders ADD CONSTRAINT valid_order_currency
  CHECK (currency IN ('UGX', 'KES', 'TZS', 'RWF', 'USD'));

-- 4. Withdrawals — payout currency
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'UGX';
ALTER TABLE withdrawal_requests DROP CONSTRAINT IF EXISTS valid_withdrawal_currency;
ALTER TABLE withdrawal_requests ADD CONSTRAINT valid_withdrawal_currency
  CHECK (currency IN ('UGX', 'KES', 'TZS', 'RWF', 'USD'));

-- 5. Platform revenue / earnings records (creator_earnings is stored in orders already)
--    No separate platform_revenue table — revenue is derived from orders.platform_fee + orders.currency.

-- 6. Update finalize_pesapal_payment to accept and persist currency from IPN payload.
--    The RPC currently reads fixed values. We extend it to accept a currency parameter.
CREATE OR REPLACE FUNCTION finalize_pesapal_payment(
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
  v_platform_fee bigint;
  v_already_processed boolean := false;
BEGIN
  -- Auth check
  IF NOT (is_admin() OR current_setting('app.api_key', true) = 'set') THEN
    RAISE EXCEPTION 'Permission denied' USING ERRCODE = '42501';
  END IF;

  -- Find the payment record
  SELECT id, order_id, status INTO v_payment_id, v_order_id, v_order_status
  FROM payments
  WHERE merchant_reference = payment_reference
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Payment not found');
  END IF;

  -- Idempotency: already completed
  IF v_order_status = 'completed' THEN
    RETURN jsonb_build_object('ok', true, 'already_processed', true);
  END IF;

  -- Get order details
  SELECT status, creator_id, creator_earnings, platform_fee
    INTO v_order_status, v_creator_id, v_creator_earnings, v_platform_fee
  FROM orders
  WHERE id = v_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Order not found');
  END IF;

  IF v_order_status = 'paid' THEN
    RETURN jsonb_build_object('ok', true, 'already_processed', true);
  END IF;

  -- Update payment
  UPDATE payments
  SET status = 'completed',
      tracking_id = pesapal_tracking_id,
      verified_at = now(),
      raw_payload = status_payload
  WHERE id = v_payment_id;

  -- Update order with currency from IPN
  UPDATE orders
  SET status = 'paid',
      paid_at = now(),
      currency = payment_currency
  WHERE id = v_order_id;

  -- Credit creator balance
  UPDATE creators
  SET balance = balance + v_creator_earnings
  WHERE id = v_creator_id;

  -- Insert download token
  INSERT INTO downloads (order_id, token, product_slug)
  SELECT v_order_id, encode(gen_random_bytes(24), 'hex'), p.slug
  FROM products p
  WHERE p.id = (SELECT product_id FROM orders WHERE id = v_order_id);

  RETURN jsonb_build_object(
    'ok', true,
    'already_processed', false,
    'order_id', v_order_id,
    'currency', payment_currency
  );
END;
$$;

-- 7. Update process_refund to carry currency through (keeps existing calling convention)
CREATE OR REPLACE FUNCTION public.process_refund(
  p_refund_id uuid,
  p_admin_user_id uuid,
  p_decision text,
  p_admin_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  o RECORD;
  v_currency text;
BEGIN
  IF NOT public.is_admin() AND current_setting('app.api_key', true) <> 'verified' THEN
    RAISE EXCEPTION 'Only admins can process refunds';
  END IF;

  SELECT * INTO r FROM public.refunds WHERE id = p_refund_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Refund not found');
  END IF;

  IF r.status != 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Refund already processed');
  END IF;

  IF p_decision = 'approved' THEN
    SELECT o.* INTO o FROM public.orders o WHERE o.id = r.order_id FOR UPDATE;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Order not found');
    END IF;

    v_currency := o.currency;

    UPDATE public.orders SET status = 'refunded', updated_at = now() WHERE id = r.order_id;

    UPDATE public.payments SET status = 'reversed', updated_at = now() WHERE id = r.payment_id;

    PERFORM public.decrement_creator_balance(o.creator_id, o.creator_earnings);

    UPDATE public.downloads SET expires_at = now() WHERE order_id = r.order_id;

    UPDATE public.refunds
    SET status = 'approved',
        admin_id = p_admin_user_id,
        admin_notes = p_admin_note,
        reversed_amount = o.creator_earnings + o.platform_fee,
        processed_at = now()
    WHERE id = p_refund_id;

    RETURN jsonb_build_object(
      'ok', true,
      'refund_id', p_refund_id,
      'order_id', r.order_id,
      'amount', o.creator_earnings + o.platform_fee,
      'currency', v_currency
    );
  ELSIF p_decision = 'rejected' THEN
    UPDATE public.refunds
    SET status = 'rejected',
        admin_id = p_admin_user_id,
        admin_notes = p_admin_note,
        processed_at = now()
    WHERE id = p_refund_id;

    RETURN jsonb_build_object('ok', true, 'refund_id', p_refund_id);
  ELSE
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid decision. Use "approved" or "rejected".');
  END IF;
END;
$$;
