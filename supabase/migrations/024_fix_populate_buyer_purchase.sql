-- 024_fix_populate_buyer_purchase.sql
-- Fixes critical bug: migration 019 overwrote populate_buyer_purchase() to
-- insert bogus reviews (rating=0, comment='') which fails CHECK constraint.
-- Restores the original behavior: insert into buyer_purchases on order paid.
-- Also adds missing SET search_path for defense-in-depth.

BEGIN;

CREATE OR REPLACE FUNCTION public.populate_buyer_purchase()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.buyer_id IS NOT NULL AND NEW.status = 'paid' THEN
    INSERT INTO public.buyer_purchases (buyer_id, order_id, product_id, creator_id, store_id)
    SELECT
      NEW.buyer_id,
      NEW.id,
      NEW.product_id,
      NEW.creator_id,
      p.store_id
    FROM public.products p
    WHERE p.id = NEW.product_id
    ON CONFLICT (buyer_id, product_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

COMMIT;
