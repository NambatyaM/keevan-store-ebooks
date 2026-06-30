-- 019_fix_production_bugs.sql
-- Fixes critical bugs in earlier migrations that were never corrected.

-- ============================================================
-- 1. Add missing updated_at columns for BEFORE UPDATE triggers
-- ============================================================
DO $do$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'rate_limits') THEN
    ALTER TABLE public.rate_limits ADD COLUMN IF NOT EXISTS updated_at timestamptz;
  END IF;
END $do$;

DO $do$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'email_queue') THEN
    ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS updated_at timestamptz;
  END IF;
END $do$;

DO $do$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'withdrawal_requests') THEN
    ALTER TABLE public.withdrawal_requests ADD COLUMN IF NOT EXISTS updated_at timestamptz;
  END IF;
END $do$;

DO $do$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'downloads') THEN
    ALTER TABLE public.downloads ADD COLUMN IF NOT EXISTS updated_at timestamptz;
  END IF;
END $do$;

-- ============================================================
-- 2. Add processed_at column to refunds (if table exists)
-- ============================================================
DO $do$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'refunds') THEN
    ALTER TABLE public.refunds ADD COLUMN IF NOT EXISTS processed_at timestamptz;
  END IF;
END $do$;

-- ============================================================
-- 3. Add payment_reference column to withdrawal_requests
-- ============================================================
DO $do$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'withdrawal_requests') THEN
    ALTER TABLE public.withdrawal_requests ADD COLUMN IF NOT EXISTS payment_reference text;
  END IF;
END $do$;

-- ============================================================
-- 4. Fix notify_withdrawal_status_change
-- ============================================================
DO $do$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'email_queue') THEN
    EXECUTE $sql$
      CREATE OR REPLACE FUNCTION public.notify_withdrawal_status_change()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        INSERT INTO public.email_queue (type, to_email, to_name, reference_type, reference_id, metadata)
        SELECT
          'withdrawal_status',
          c.email,
          c.display_name,
          'withdrawal_requests',
          NEW.id,
          jsonb_build_object(
            'withdrawal_id', NEW.id,
            'amount', NEW.amount,
            'status', NEW.status,
            'admin_notes', NEW.admin_notes
          )
        FROM public.creators c
        WHERE c.id = NEW.creator_id;
        RETURN NEW;
      END;
      $$;
    $sql$;
  END IF;
END $do$;

-- ============================================================
-- 5. Fix transition_withdrawal_request
-- ============================================================
DO $do$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'transition_withdrawal_request') THEN
    EXECUTE $sql$
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
    $sql$;
  END IF;
END $do$;

-- ============================================================
-- 6. Fix process_refund (only if refunds table exists)
-- ============================================================
DO $do$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'refunds') THEN
    EXECUTE $sql$
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
          UPDATE public.downloads SET expires_at = now(), updated_at = now() WHERE order_id = r.order_id;
          UPDATE public.refunds
          SET status = 'approved',
              admin_id = p_admin_user_id,
              admin_notes = p_admin_note,
              reversed_amount = o.creator_earnings + o.platform_fee,
              processed_at = now()
          WHERE id = p_refund_id;
          RETURN jsonb_build_object('ok', true, 'refund_id', p_refund_id, 'order_id', r.order_id, 'amount', o.creator_earnings + o.platform_fee, 'currency', v_currency);
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
    $sql$;
  END IF;
END $do$;

-- ============================================================
-- 7. Fix populate_buyer_purchase (only if reviews table exists)
-- ============================================================
DO $do$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'reviews') THEN
    EXECUTE $sql$
      CREATE OR REPLACE FUNCTION public.populate_buyer_purchase()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        INSERT INTO public.reviews (product_id, buyer_id, order_id, rating, comment)
        SELECT NEW.product_id, NEW.buyer_id, NEW.id, 0, ''
        WHERE NOT EXISTS (
          SELECT 1 FROM public.reviews
          WHERE order_id = NEW.id
        );
        RETURN NEW;
      END;
      $$;
    $sql$;
  END IF;
END $do$;
