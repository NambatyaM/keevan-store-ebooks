-- 009_refund_system.sql
-- ============================================================
-- 1. Refund status enum
-- 2. Refunds table with FK constraints
-- 3. decrement_creator_balance RPC (mirror of increment)
-- 4. process_refund RPC (atomic admin approval/rejection)
-- 5. Notification trigger for refund status changes
-- 6. Indexes + RLS

-- ============================================================
-- PART 1: Refund Status Enum
-- ============================================================

CREATE TYPE public.refund_status AS ENUM ('pending', 'approved', 'rejected');

-- ============================================================
-- PART 2: Refunds Table
-- ============================================================

CREATE TABLE public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
  buyer_email text NOT NULL,
  buyer_name text NOT NULL,
  reason text NOT NULL CHECK (char_length(reason) >= 10),
  status public.refund_status NOT NULL DEFAULT 'pending',
  admin_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  admin_notes text,
  pesapal_refund_response jsonb,
  reversed_amount bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refunds_status ON public.refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_order ON public.refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_created_at ON public.refunds(created_at DESC);

ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage refunds" ON public.refunds
  FOR ALL USING (public.is_admin());

CREATE POLICY "Buyers can view their own refunds" ON public.refunds
  FOR SELECT USING (buyer_email = auth.email());

-- ============================================================
-- PART 3: decrement_creator_balance RPC
-- ============================================================

CREATE OR REPLACE FUNCTION public.decrement_creator_balance(creator_row_id uuid, amount bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.creators
  SET available_balance = GREATEST(0, available_balance - amount),
      total_earnings = GREATEST(0, total_earnings - amount),
      updated_at = now()
  WHERE id = creator_row_id;
END;
$$;

-- ============================================================
-- PART 4: process_refund RPC
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
  IF NOT public.is_admin() THEN
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
-- PART 5: Notification Trigger for Refund Status Changes
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
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_refund_status_change ON public.refunds;
CREATE TRIGGER trg_notify_refund_status_change
  AFTER UPDATE OF status ON public.refunds
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'approved')
  EXECUTE FUNCTION public.notify_refund_status_change();
