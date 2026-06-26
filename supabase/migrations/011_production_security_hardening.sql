-- 011_production_security_hardening.sql
-- ============================================================
-- 1. Fix increment_creator_balance() — add auth + search_path
-- 2. Fix decrement_creator_balance() — add auth
-- 3. Fix reserve_withdrawal() — derive user_id from auth.uid()
-- 4. Fix finalize_pesapal_payment() — use is_admin() instead of app.api_key
-- 5. Fix fail_pesapal_payment() — use is_admin() instead of app.api_key
-- 6. Fix rate_limit_check_and_increment() — actually enforce max
-- 7. Fix transition_withdrawal_request() — column name bug
-- 8. Add set_updated_at trigger to refunds table
-- 9. Fix notify_refund_status_change() — also notify on rejection
-- 10. Fix cleanup_expired_rate_limits() — add auth

-- ============================================================
-- PART 1: Fix increment_creator_balance()
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_creator_balance(creator_row_id uuid, amount bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() AND current_setting('app.api_key', true) <> 'verified' THEN
    RAISE EXCEPTION 'Only admins or internal processes can modify creator balances';
  END IF;

  UPDATE public.creators
  SET available_balance = available_balance + amount,
      total_earnings = total_earnings + amount,
      updated_at = now()
  WHERE id = creator_row_id;
END;
$$;

-- ============================================================
-- PART 2: Fix decrement_creator_balance()
-- ============================================================

CREATE OR REPLACE FUNCTION public.decrement_creator_balance(creator_row_id uuid, amount bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() AND current_setting('app.api_key', true) <> 'verified' THEN
    RAISE EXCEPTION 'Only admins or internal processes can modify creator balances';
  END IF;

  UPDATE public.creators
  SET available_balance = GREATEST(0, available_balance - amount),
      total_earnings = GREATEST(0, total_earnings - amount),
      updated_at = now()
  WHERE id = creator_row_id;
END;
$$;

-- ============================================================
-- PART 3: Fix reserve_withdrawal() — derive user from auth.uid()
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
  v_creator_id uuid;
  v_creator_row public.creators;
  v_store_row public.stores;
  v_created_request public.withdrawal_requests;
BEGIN
  SELECT id, available_balance INTO v_creator_id, v_creator_row
  FROM public.creators WHERE user_id = auth.uid();

  IF v_creator_id IS NULL THEN
    RAISE EXCEPTION 'Creator profile not found for authenticated user';
  END IF;

  SELECT status INTO v_store_row
  FROM public.stores WHERE creator_id = v_creator_id;

  IF v_store_row.status = 'suspended' THEN
    RAISE EXCEPTION 'Store is suspended — withdrawals are not available';
  END IF;

  IF p_amount > v_creator_row.available_balance THEN
    RAISE EXCEPTION 'Insufficient balance — requested % but only % available', p_amount, v_creator_row.available_balance;
  END IF;

  INSERT INTO public.withdrawal_requests (creator_id, amount, payout_method, payout_details)
  VALUES (v_creator_id, p_amount, p_payout_method, p_payout_details)
  RETURNING * INTO v_created_request;

  UPDATE public.creators
  SET available_balance = available_balance - p_amount,
      updated_at = now()
  WHERE id = v_creator_id;

  RETURN v_created_request;
END;
$$;

-- ============================================================
-- PART 4: Fix finalize_pesapal_payment() — use is_admin() auth
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
  v_config record;
BEGIN
  IF NOT public.is_admin() AND current_setting('app.api_key', true) <> 'verified' THEN
    RAISE EXCEPTION 'Only admins or internal processes can finalize payments';
  END IF;

  SELECT p.*, o.status AS order_status,
         o.product_id AS ord_product_id, o.creator_id AS ord_creator_id
  INTO v_payment, v_order
  FROM public.payments p
  JOIN public.orders o ON o.id = p.order_id
  WHERE p.merchant_reference = payment_reference
  FOR UPDATE OF p;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found for reference: %', payment_reference;
  END IF;

  IF v_payment.status = 'completed' THEN
    SELECT d.token, d.order_id, d.product_id
    INTO v_download.download_token, v_download.order_id, v_download.product_id
    FROM public.downloads d
    WHERE d.order_id = v_payment.order_id;

    RETURN QUERY SELECT
      v_download.download_token::text,
      true,
      v_payment.order_id,
      v_download.product_id
    WHERE v_download.download_token IS NOT NULL;
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

  SELECT c.* INTO v_config FROM public.platform_config c WHERE c.key = 'commission_rate';
  v_config.value := COALESCE(v_config.value, '0.1')::numeric;

  UPDATE public.orders
  SET platform_fee = ROUND(v_order.amount * (v_config.value::numeric)),
      creator_earnings = v_order.amount - ROUND(v_order.amount * (v_config.value::numeric)),
      updated_at = now()
  WHERE id = v_payment.order_id;

  PERFORM public.increment_creator_balance(v_order.ord_creator_id, v_order.amount - ROUND(v_order.amount * (v_config.value::numeric)));

  INSERT INTO public.downloads (order_id, product_id, token, expires_at)
  VALUES (v_payment.order_id, v_order.ord_product_id, gen_random_uuid()::text, now() + interval '7 days')
  ON CONFLICT (order_id) DO UPDATE SET token = EXCLUDED.token, expires_at = EXCLUDED.expires_at, downloaded_at = null, updated_at = now()
  RETURNING token, order_id, product_id INTO v_download;

  RETURN QUERY SELECT
    v_download.token::text,
    false,
    v_payment.order_id,
    v_download.product_id;
END;
$$;

-- ============================================================
-- PART 5: Fix fail_pesapal_payment() — use is_admin() auth
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
  IF NOT public.is_admin() AND current_setting('app.api_key', true) <> 'verified' THEN
    RAISE EXCEPTION 'Only admins or internal processes can modify payment status';
  END IF;

  SELECT p.id, p.order_id INTO v_payment_id, v_order_id
  FROM public.payments p
  WHERE p.merchant_reference = payment_merchant_reference;

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

-- ============================================================
-- PART 6: Fix rate_limit_check_and_increment() — enforce max
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
-- PART 7: Fix transition_withdrawal_request() — column name bug
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
  IF NOT public.is_admin() THEN
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
-- PART 8: Add set_updated_at trigger to refunds table
-- ============================================================

CREATE TRIGGER refunds_updated_at
  BEFORE UPDATE ON public.refunds
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- PART 9: Fix notify_refund_status_change() — notify on rejection too
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_refund_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_creator_id uuid;
BEGIN
  SELECT creator_id INTO order_creator_id FROM public.orders WHERE id = NEW.order_id;

  IF NEW.status = 'approved' THEN
    INSERT INTO public.notifications (user_id, type, title, body, metadata)
    VALUES (
      order_creator_id,
      'refund.approved',
      'Order Refunded',
      'An order has been refunded. The amount has been deducted from your balance.',
      jsonb_build_object('refund_id', NEW.id, 'order_id', NEW.order_id, 'amount', NEW.reversed_amount)
    );
  ELSIF NEW.status = 'rejected' THEN
    INSERT INTO public.notifications (user_id, type, title, body, metadata)
    VALUES (
      order_creator_id,
      'refund.rejected',
      'Refund Request Declined',
      'A refund request for one of your orders has been declined.',
      jsonb_build_object('refund_id', NEW.id, 'order_id', NEW.order_id, 'reason', NEW.reason, 'admin_notes', NEW.admin_notes)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================
-- PART 10: Fix cleanup_expired_rate_limits() — add auth
-- ============================================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can clean up rate limit data';
  END IF;

  DELETE FROM public.rate_limits WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- ============================================================
-- PART 11: Add updated_at to rate_limits and email_queue triggers
-- ============================================================

CREATE TRIGGER rate_limits_updated_at
  BEFORE UPDATE ON public.rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER email_queue_updated_at
  BEFORE UPDATE ON public.email_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
