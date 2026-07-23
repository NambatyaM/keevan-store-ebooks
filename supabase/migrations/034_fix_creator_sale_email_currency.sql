-- 034_fix_creator_sale_email_currency.sql
-- Pass order currency in creator sale notification metadata

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
      'currency', NEW.currency,
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
