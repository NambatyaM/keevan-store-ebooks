-- 015_production_fixes.sql
-- ============================================================
-- 1. Add set_app_api_key() helper for service-role RPC auth
-- 2. Fix increment_discount_use() — add FOR UPDATE locking
-- 3. Add partial unique index for duplicate order prevention
-- 4. Fix RLS on discounts to include starts_at
-- 5. Add missing indexes for performance
-- ============================================================

-- ============================================================
-- PART 1: Helper RPC to propagate auth context to SECURITY DEFINER functions
-- SECURITY INVOKER so it runs with the caller's permissions (service_role)
-- and sets the app.api_key config parameter visible to subsequent RPCs.
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_app_api_key()
RETURNS void
LANGUAGE sql
SECURITY INVOKER
AS $$
  SELECT set_config('app.api_key', 'verified', true);
$$;

-- ============================================================
-- PART 2: Fix increment_discount_use() — add FOR UPDATE to prevent
-- concurrent purchases from exceeding max_uses (C-5)
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_discount_use(discount_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_discount public.discounts;
BEGIN
  SELECT * INTO v_discount
  FROM public.discounts
  WHERE id = discount_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Discount not found';
  END IF;

  IF v_discount.max_uses IS NOT NULL AND v_discount.use_count >= v_discount.max_uses THEN
    RAISE EXCEPTION 'Discount has reached maximum uses';
  END IF;

  IF v_discount.expires_at <= now() THEN
    RAISE EXCEPTION 'Discount has expired';
  END IF;

  UPDATE public.discounts
  SET use_count = use_count + 1
  WHERE id = discount_id;
END;
$$;

-- ============================================================
-- PART 3: Partial unique index to prevent duplicate pending orders
-- for the same buyer+product combination (C-4)
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_pending_buyer_product
  ON public.orders (buyer_email, product_id)
  WHERE status = 'pending';

-- ============================================================
-- PART 4: Fix RLS on discounts to also check starts_at (M-1)
-- ============================================================

DROP POLICY IF EXISTS "public read active discounts" ON public.discounts;

CREATE POLICY "public read active and started discounts" ON public.discounts
  FOR SELECT
  USING (
    is_active = true
    AND expires_at > now()
    AND starts_at <= now()
  );

-- ============================================================
-- PART 5: Add missing indexes for performance (H-8)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_orders_buyer_product
  ON public.orders (buyer_email, product_id);

CREATE INDEX IF NOT EXISTS idx_orders_buyer_id
  ON public.orders (buyer_id)
  WHERE buyer_id IS NOT NULL;

-- ============================================================
-- PART 6: Fix process_refund() — update is_admin() check to
-- also allow service_role calls via app.api_key (C-6)
-- ============================================================

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

    UPDATE public.orders SET status = 'refunded', updated_at = now() WHERE id = r.order_id;

    UPDATE public.payments SET status = 'reversed', updated_at = now() WHERE id = r.payment_id;

    PERFORM public.decrement_creator_balance(o.creator_id, o.creator_earnings);

    UPDATE public.downloads SET expires_at = now() WHERE order_id = r.order_id;

    UPDATE public.refunds
    SET status = 'approved',
        admin_id = p_admin_user_id,
        admin_notes = COALESCE(p_admin_note, admin_notes),
        reversed_amount = o.amount,
        updated_at = now()
    WHERE id = p_refund_id;

    RETURN jsonb_build_object(
      'ok', true, 'action', 'approved',
      'order_id', o.id, 'reversed_amount', o.amount
    );

  ELSIF p_decision = 'rejected' THEN
    UPDATE public.refunds
    SET status = 'rejected',
        admin_id = p_admin_user_id,
        admin_notes = COALESCE(p_admin_note, admin_notes),
        updated_at = now()
    WHERE id = p_refund_id;

    RETURN jsonb_build_object('ok', true, 'action', 'rejected');
  ELSE
    RETURN jsonb_build_object('ok', false, 'error', 'Decision must be approved or rejected');
  END IF;
END;
$$;

-- ============================================================
-- PART 7: Fix transition_withdrawal_request() — add app.api_key support (C-6)
-- ============================================================

CREATE OR REPLACE FUNCTION public.transition_withdrawal_request(
  withdrawal_id uuid,
  new_status text,
  admin_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing public.withdrawal_requests;
BEGIN
  IF NOT public.is_admin() AND current_setting('app.api_key', true) <> 'verified' THEN
    RAISE EXCEPTION 'Only admins can process withdrawal requests';
  END IF;

  SELECT * INTO existing FROM public.withdrawal_requests WHERE id = withdrawal_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal request not found';
  END IF;

  IF new_status = 'approved' AND existing.status = 'pending' THEN
    UPDATE public.withdrawal_requests
    SET status = 'approved',
        admin_notes = COALESCE(admin_note, admin_notes),
        reviewed_at = now(),
        updated_at = now()
    WHERE id = withdrawal_id;
  ELSIF new_status = 'rejected' AND existing.status = 'pending' THEN
    UPDATE public.withdrawal_requests
    SET status = 'rejected',
        admin_notes = COALESCE(admin_note, admin_notes),
        reviewed_at = now(),
        updated_at = now()
    WHERE id = withdrawal_id;

    UPDATE public.creators
    SET available_balance = available_balance + existing.amount,
        updated_at = now()
    WHERE id = existing.creator_id;
  ELSIF new_status = 'paid' AND existing.status = 'approved' THEN
    UPDATE public.withdrawal_requests
    SET status = 'paid',
        admin_notes = COALESCE(admin_note, admin_notes),
        paid_at = now(),
        updated_at = now()
    WHERE id = withdrawal_id;
  ELSE
    RAISE EXCEPTION 'Invalid status transition: % -> %', existing.status, new_status;
  END IF;
END;
$$;

-- ============================================================
-- PART 8: Fix finalize_pesapal_payment() — use stored fees (M-6)
-- Removes commission rate recalculation. Instead, respects the
-- platform_fee and creator_earnings stored at order creation time.
-- ============================================================

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
  v_order public.orders;
  v_download public.downloads;
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

  SELECT o.* INTO v_order
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

  -- Use stored fee values from order creation, do NOT recalculate
  PERFORM public.increment_creator_balance(v_order.creator_id, v_order.creator_earnings);

  INSERT INTO public.downloads (order_id, product_id, token, expires_at)
  VALUES (v_payment.order_id, v_order.product_id, gen_random_uuid(), now() + interval '7 days')
  ON CONFLICT (order_id) DO UPDATE SET token = EXCLUDED.token, expires_at = EXCLUDED.expires_at, downloaded_at = null
  RETURNING * INTO v_download;

  RETURN QUERY SELECT
    v_download.token::text,
    false,
    v_payment.order_id,
    v_download.product_id;
END;
$$;
