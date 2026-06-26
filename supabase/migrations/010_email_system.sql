-- 010_email_system.sql
-- ============================================================
-- 1. Email types & queue table
-- 2. Trigger functions for automated enqueuing
-- 3. Indexes + RLS

-- ============================================================
-- PART 1: Email Types & Queue Table
-- ============================================================

CREATE TYPE public.email_type AS ENUM (
  'order_confirmation',
  'withdrawal_status',
  'refund_status'
);

CREATE TYPE public.email_status AS ENUM ('pending', 'sent', 'failed');

CREATE TABLE public.email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.email_type NOT NULL,
  to_email text NOT NULL,
  to_name text,
  reference_type text NOT NULL,
  reference_id uuid NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status public.email_status NOT NULL DEFAULT 'pending',
  error_message text,
  retry_count integer NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(status, created_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON public.email_queue(created_at DESC);

ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage email queue" ON public.email_queue
  FOR ALL USING (public.is_admin());

-- ============================================================
-- PART 2: Trigger — enqueue order confirmation on payment
-- ============================================================

CREATE OR REPLACE FUNCTION public.enqueue_order_confirmation_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.email_queue (type, to_email, to_name, reference_type, reference_id, metadata)
  SELECT
    'order_confirmation',
    NEW.buyer_email,
    NEW.buyer_name,
    'orders',
    NEW.id,
    jsonb_build_object(
      'amount', NEW.amount,
      'product_title', p.title,
      'creator_name', c.display_name
    )
  FROM public.products p
  JOIN public.creators c ON c.id = p.creator_id
  WHERE p.id = NEW.product_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_order_confirmation ON public.orders;

CREATE TRIGGER trg_enqueue_order_confirmation
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status = 'paid')
  EXECUTE FUNCTION public.enqueue_order_confirmation_email();

-- ============================================================
-- PART 3: Trigger — enqueue withdrawal status notification
-- ============================================================

CREATE OR REPLACE FUNCTION public.enqueue_withdrawal_status_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.email_queue (type, to_email, to_name, reference_type, reference_id, metadata)
  SELECT
    'withdrawal_status',
    u.email,
    c.display_name,
    'withdrawal_requests',
    NEW.id,
    jsonb_build_object(
      'amount', NEW.amount,
      'status', NEW.status,
      'admin_notes', NEW.admin_notes,
      'payout_method', NEW.payout_method
    )
  FROM public.creators c
  JOIN public.users u ON u.id = c.user_id
  WHERE c.id = NEW.creator_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_withdrawal_status ON public.withdrawal_requests;

CREATE TRIGGER trg_enqueue_withdrawal_status
  AFTER UPDATE OF status ON public.withdrawal_requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.enqueue_withdrawal_status_email();

-- ============================================================
-- PART 4: Trigger — enqueue refund status notification
-- ============================================================

CREATE OR REPLACE FUNCTION public.enqueue_refund_status_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.email_queue (type, to_email, to_name, reference_type, reference_id, metadata)
  SELECT
    'refund_status',
    NEW.buyer_email,
    NEW.buyer_name,
    'refunds',
    NEW.id,
    jsonb_build_object(
      'status', NEW.status,
      'admin_notes', NEW.admin_notes,
      'reason', NEW.reason,
      'reversed_amount', NEW.reversed_amount
    )
  FROM public.orders o
  JOIN public.products p ON p.id = o.product_id
  WHERE o.id = NEW.order_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_refund_status ON public.refunds;

CREATE TRIGGER trg_enqueue_refund_status
  AFTER UPDATE OF status ON public.refunds
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('approved', 'rejected'))
  EXECUTE FUNCTION public.enqueue_refund_status_email();
