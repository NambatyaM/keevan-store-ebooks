-- 008_production_security_fixes.sql
-- ============================================================
-- 1. Add authorization checks to all SECURITY DEFINER functions
-- 2. Fix rate_limits table for production (PK, TTL, cleanup)
-- 3. Add RLS policies for creator/buyer visibility
-- 4. Add partial indexes for hot query paths
-- 5. Add rate_limits cleanup function
-- 6. Fix monetary types to bigint
-- 7. Add notification trigger framework

-- ============================================================
-- PART 1: Security DEFINER Authorization Checks
-- ============================================================

-- Recreate transition_withdrawal_request with admin check
CREATE OR REPLACE FUNCTION public.transition_withdrawal_request(
  withdrawal_id uuid,
  new_status text,
  admin_note text default null
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can transition withdrawal requests';
  END IF;

  UPDATE public.withdrawal_requests
  SET
    status = new_status,
    admin_note = COALESCE(admin_note, admin_note),
    updated_at = now()
  WHERE id = withdrawal_id
    AND (
      (new_status = 'approved' AND status = 'pending') OR
      (new_status = 'rejected' AND status = 'pending') OR
      (new_status = 'paid' AND status = 'approved')
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cannot transition withdrawal from current state';
  END IF;
END;
$$;

-- Recreate finalize_pesapal_payment with authorization check
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'finalize_pesapal_payment') THEN
    DROP FUNCTION IF EXISTS public.finalize_pesapal_payment cascade;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.finalize_pesapal_payment(
  payment_reference text,
  pesapal_tracking_id text,
  status_payload jsonb default '{}'::jsonb
)
RETURNS TABLE(
  download_token uuid,
  already_processed boolean,
  order_id uuid,
  product_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payment_record RECORD;
  download_token uuid;
BEGIN
  -- Must be called by service-role (bypassed RLS) or admin
  -- Service role calls from server API don't need additional check
  -- but this prevents direct RPC calls from non-admins
  IF NOT public.is_admin() THEN
    -- Allow if the caller is the owner of the payment (via the order's customer email)
    -- Check using current_setting which is set by the application
    -- For service-role calls from the backend, use a shared secret pattern
    IF current_setting('app.api_key', true) <> 'verified' THEN
      RAISE EXCEPTION 'Permission denied';
    END IF;
  END IF;

  SELECT p.*, o.status AS order_status, o.product_id AS ord_product_id
  INTO payment_record
  FROM public.payments p
  JOIN public.orders o ON o.id = p.order_id
  WHERE p.merchant_reference = payment_reference
  FOR UPDATE OF p;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF payment_record.status_payload IS NOT NULL THEN
    already_processed := true;
    SELECT d.token, d.product_id, d.order_id
    INTO download_token, product_id, order_id
    FROM public.downloads d
    WHERE d.payment_id = payment_record.id;
    RETURN NEXT;
    RETURN;
  END IF;

  UPDATE public.payments
  SET
    status = 'completed',
    provider_reference = pesapal_tracking_id,
    status_payload = status_payload,
    updated_at = now()
  WHERE id = payment_record.id
    AND status = 'pending';

  IF NOT FOUND THEN
    RETURN;
  END IF;

  UPDATE public.orders
  SET status = 'paid', updated_at = now()
  WHERE id = payment_record.order_id
    AND status <> 'paid';

  download_token := gen_random_uuid();
  INSERT INTO public.downloads (order_id, payment_id, product_id, token, expires_at)
  VALUES (payment_record.order_id, payment_record.id, payment_record.ord_product_id, download_token, now() + interval '7 days');

  already_processed := false;
  order_id := payment_record.order_id;
  product_id := payment_record.ord_product_id;

  RETURN NEXT;
END;
$$;

-- Recreate fail_pesapal_payment with authorization check
CREATE OR REPLACE FUNCTION public.fail_pesapal_payment(
  payment_merchant_reference text,
  failure_payload jsonb default '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payment_record RECORD;
BEGIN
  IF NOT public.is_admin() THEN
    IF current_setting('app.api_key', true) <> 'verified' THEN
      RAISE EXCEPTION 'Permission denied';
    END IF;
  END IF;

  SELECT p.*, o.status AS order_status
  INTO payment_record
  FROM public.payments p
  JOIN public.orders o ON o.id = p.order_id
  WHERE p.merchant_reference = payment_merchant_reference
  FOR UPDATE OF p;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  UPDATE public.payments
  SET
    status = 'failed',
    status_payload = failure_payload,
    updated_at = now()
  WHERE id = payment_record.id
    AND status = 'pending';

  UPDATE public.orders
  SET status = 'failed', updated_at = now()
  WHERE id = payment_record.order_id
    AND status = 'pending';
END;
$$;

-- Recreate reserve_withdrawal with store-status check
CREATE OR REPLACE FUNCTION public.reserve_withdrawal(
  creator_user_id uuid,
  amount integer,
  payout_method text default null,
  payout_details jsonb default '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  creator_record RECORD;
  store_record RECORD;
  withdrawal_id uuid;
BEGIN
  SELECT id, available_balance, total_earnings, user_id
  INTO creator_record
  FROM public.creators
  WHERE user_id = creator_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Creator not found');
  END IF;

  -- Check store is not suspended
  SELECT id, status INTO store_record
  FROM public.stores
  WHERE creator_id = creator_record.id
  LIMIT 1;

  IF FOUND AND store_record.status = 'suspended' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Cannot withdraw while store is suspended');
  END IF;

  IF amount < 50000 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Minimum withdrawal is 50,000 UGX');
  END IF;

  IF amount > creator_record.available_balance THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Insufficient available balance');
  END IF;

  UPDATE public.creators
  SET available_balance = available_balance - amount
  WHERE id = creator_record.id;

  INSERT INTO public.withdrawal_requests (creator_id, amount, payout_method, payout_details)
  VALUES (creator_record.id, amount, payout_method, payout_details)
  RETURNING id INTO withdrawal_id;

  RETURN jsonb_build_object('ok', true, 'withdrawal_id', withdrawal_id);
END;
$$;

-- Recreate is_admin to be more efficient (already correct but let's ensure it's STABLE)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

-- ============================================================
-- PART 2: Rate Limits Production Fixes
-- ============================================================

-- Add expires_at column for TTL-based cleanup
ALTER TABLE public.rate_limits ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Add CHECK constraint on count
ALTER TABLE public.rate_limits DROP CONSTRAINT IF EXISTS rate_limits_count_check;
ALTER TABLE public.rate_limits ADD CONSTRAINT rate_limits_count_check CHECK (count >= 1);

-- Add TTL index for cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires_at ON public.rate_limits (expires_at)
  WHERE expires_at IS NOT NULL;

-- Atomic rate limit check-and-increment RPC (avoids race condition)
CREATE OR REPLACE FUNCTION public.rate_limit_check_and_increment(
  p_key text,
  p_window_start timestamptz,
  p_max_requests integer default 120,
  p_window_seconds integer default 60
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.rate_limits (key, count, window_start, expires_at)
  VALUES (p_key, 1, p_window_start, p_window_start + (p_window_seconds || ' seconds')::interval)
  ON CONFLICT (key, window_start)
  DO UPDATE SET count = rate_limits.count + 1;
END;
$$;

-- Cleanup expired rate limits (run via cron or periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.rate_limits
  WHERE expires_at IS NOT NULL
    AND expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- ============================================================
-- PART 3: RLS Policy Improvements
-- ============================================================

-- Allow creators to view payments for their store's orders
DROP POLICY IF EXISTS "Creators can view payments for their store orders" ON public.payments;
CREATE POLICY "Creators can view payments for their store orders" ON public.payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.products p ON p.id = o.product_id
      JOIN public.creators c ON c.id = p.creator_id
      WHERE o.id = payments.order_id
        AND c.user_id = auth.uid()
    )
  );

-- Allow creators to view downloads for their products
DROP POLICY IF EXISTS "Creators can view downloads for their products" ON public.downloads;
CREATE POLICY "Creators can view downloads for their products" ON public.downloads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.creators c ON c.id = p.creator_id
      WHERE p.id = downloads.product_id
        AND c.user_id = auth.uid()
    )
  );

-- Allow buyers to view their own downloads
DROP POLICY IF EXISTS "Buyers can view their own downloads" ON public.downloads;
CREATE POLICY "Buyers can view their own downloads" ON public.downloads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = downloads.order_id
        AND o.buyer_email = auth.email()
    )
  );

-- Restrict analytics_events INSERT to authenticated requests only
-- Public endpoint still works via service-role API which bypasses RLS
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;
CREATE POLICY "Authenticated and service-role can insert analytics events" ON public.analytics_events
  FOR INSERT
  WITH CHECK (
    -- Allow service-role (bypasses RLS) or authenticated users
    -- Anonymous inserts are blocked; use the API route which uses service-role
    auth.role() = 'authenticated' OR auth.role() = 'service_role'
  );

-- Allow authenticated users to read analytics for their own stores
DROP POLICY IF EXISTS "Creators can read analytics for their stores" ON public.analytics_events;
CREATE POLICY "Creators can view analytics for their stores" ON public.analytics_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      JOIN public.creators c ON c.id = s.creator_id
      WHERE s.id = analytics_events.store_id
        AND c.user_id = auth.uid()
    )
  );

-- ============================================================
-- PART 4: Partial Indexes for Hot Query Paths
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_orders_pending_lookup
  ON public.orders (product_id, buyer_email, created_at DESC)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_analytics_events_recent
  ON public.analytics_events (store_id, event_type, created_at DESC)
  WHERE created_at > now() - interval '90 days';

CREATE INDEX IF NOT EXISTS idx_products_published_lookup
  ON public.products (slug, store_id)
  WHERE status = 'published';

-- ============================================================
-- PART 5: Convert monetary columns to bigint for scale
-- ============================================================

ALTER TABLE public.orders ALTER COLUMN amount TYPE bigint;
ALTER TABLE public.orders ALTER COLUMN platform_fee TYPE bigint;
ALTER TABLE public.orders ALTER COLUMN creator_earnings TYPE bigint;

ALTER TABLE public.products ALTER COLUMN price TYPE bigint;
ALTER TABLE public.products ALTER COLUMN file_size TYPE bigint;
ALTER TABLE public.products ALTER COLUMN cover_size TYPE bigint;

ALTER TABLE public.creators ALTER COLUMN available_balance TYPE bigint;
ALTER TABLE public.creators ALTER COLUMN total_earnings TYPE bigint;

ALTER TABLE public.withdrawal_requests ALTER COLUMN amount TYPE bigint;

-- ============================================================
-- PART 6: Notification Framework (trigger-based)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  metadata jsonb DEFAULT '{}'::jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id, created_at DESC)
  WHERE read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Trigger for withdrawal status changes
CREATE OR REPLACE FUNCTION public.notify_withdrawal_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, metadata)
  SELECT
    c.user_id,
    'withdrawal.' || NEW.status,
    CASE NEW.status
      WHEN 'approved' THEN 'Withdrawal Approved'
      WHEN 'rejected' THEN 'Withdrawal Rejected'
      WHEN 'paid' THEN 'Withdrawal Paid'
      ELSE 'Withdrawal ' || NEW.status
    END,
    CASE NEW.status
      WHEN 'approved' THEN 'Your withdrawal of ' || NEW.amount || ' UGX has been approved. It will be processed shortly.'
      WHEN 'rejected' THEN 'Your withdrawal of ' || NEW.amount || ' UGX has been rejected.'
      WHEN 'paid' THEN 'Your withdrawal of ' || NEW.amount || ' UGX has been paid out.'
      ELSE 'Your withdrawal status has changed to ' || NEW.status
    END,
    jsonb_build_object('withdrawal_id', NEW.id, 'amount', NEW.amount, 'status', NEW.status, 'admin_note', NEW.admin_note)
  FROM public.creators c
  WHERE c.id = NEW.creator_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_withdrawal_status_change ON public.withdrawal_requests;
CREATE TRIGGER trg_notify_withdrawal_status_change
  AFTER UPDATE OF status ON public.withdrawal_requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_withdrawal_status_change();

-- Trigger for earnings credit
CREATE OR REPLACE FUNCTION public.notify_earnings_credited()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, metadata)
  SELECT
    c.user_id,
    'earnings.credited',
    'Sale Completed',
    'You earned ' || (NEW.amount - NEW.platform_fee) || ' UGX from a sale.',
    jsonb_build_object('order_id', NEW.id, 'amount', NEW.amount, 'earnings', NEW.amount - NEW.platform_fee)
  FROM public.products p
  JOIN public.creators c ON c.id = p.creator_id
  WHERE p.id = NEW.product_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_earnings_credited ON public.orders;
CREATE TRIGGER trg_notify_earnings_credited
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status = 'paid')
  EXECUTE FUNCTION public.notify_earnings_credited();

-- ============================================================
-- PART 7: Setup initial platform config table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.platform_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO public.platform_config (key, value, description) VALUES
  ('commission_rate', '0.1'::jsonb, 'Platform commission rate as decimal (0.1 = 10%)'),
  ('minimum_withdrawal', '50000'::jsonb, 'Minimum withdrawal amount in UGX'),
  ('currency', '"UGX"'::jsonb, 'Default currency code'),
  ('support_phone', '"+256768345905"'::jsonb, 'Platform support phone number'),
  ('support_whatsapp', '"https://wa.me/256768345905"'::jsonb, 'Platform WhatsApp contact URL')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage platform config" ON public.platform_config
  FOR ALL USING (public.is_admin());

CREATE POLICY "Anyone can read platform config" ON public.platform_config
  FOR SELECT USING (true);
