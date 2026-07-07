-- 029_fix_email_triggers_and_add_creator_order_email.sql
-- Fixes two email delivery issues:
--   1. notify_withdrawal_status_change references c.email which doesn't exist on creators table
--   2. Creators are not notified when someone purchases their product

-- ============================================================
-- 1. Fix notify_withdrawal_status_change — join with users to get email
-- ============================================================
DO $do$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'notify_withdrawal_status_change') THEN
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
          u.email,
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
        JOIN public.users u ON u.id = c.user_id
        WHERE c.id = NEW.creator_id;
        RETURN NEW;
      END;
      $$;
    $sql$;
  END IF;
END $do$;

-- ============================================================
-- 2. Add trigger to notify creators when an order is paid
-- ============================================================
DO $do$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'email_queue') THEN
    EXECUTE $sql$
      CREATE OR REPLACE FUNCTION public.enqueue_creator_order_notification()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        INSERT INTO public.email_queue (type, to_email, to_name, reference_type, reference_id, metadata)
        SELECT
          'order_confirmation',
          u.email,
          c.display_name,
          'orders',
          NEW.id,
          jsonb_build_object(
            'amount', NEW.amount,
            'product_title', p.title,
            'creator_name', c.display_name,
            'buyer_email', NEW.buyer_email,
            'type', 'creator_sale'
          )
        FROM public.creators c
        JOIN public.users u ON u.id = c.user_id
        JOIN public.products p ON p.id = NEW.product_id
        WHERE c.id = NEW.creator_id;

        RETURN NEW;
      END;
      $$;

      DROP TRIGGER IF EXISTS trg_enqueue_creator_order_notification ON public.orders;
      CREATE TRIGGER trg_enqueue_creator_order_notification
        AFTER UPDATE OF status ON public.orders
        FOR EACH ROW
        WHEN (OLD.status = 'pending' AND NEW.status = 'paid')
        EXECUTE FUNCTION public.enqueue_creator_order_notification();
    $sql$;
  END IF;
END $do$;
