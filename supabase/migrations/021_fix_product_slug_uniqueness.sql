-- 021_fix_product_slug_uniqueness.sql
--
-- Bug: products.slug has a global UNIQUE constraint, but the requirement
-- is that slugs are unique *within a store* (store_id, slug).
-- A creator should be able to use "my-ebook" even if another creator
-- already has a product with that slug in their own store.
--
-- Fix:
--   1. Drop the global unique constraint from migration 001.
--   2. Add a composite unique constraint on (store_id, slug).
--   3. Keep the CHECK constraint enforcing slug format.

BEGIN;

-- ----------------------------------------------------------------
-- 1. Drop the old global unique constraint on products.slug
--    PostgreSQL auto-names inline column UNIQUE as products_slug_key
-- ----------------------------------------------------------------
DO $do$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_slug_key'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products DROP CONSTRAINT products_slug_key;
  END IF;
END $do$;

-- Also drop the btree index products_slug_idx that was created in migration 001
-- (it served the old global unique; the new composite index replaces it)
DROP INDEX IF EXISTS public.products_slug_idx;

-- ----------------------------------------------------------------
-- 2. Add a composite unique constraint: slug must be unique per store
-- ----------------------------------------------------------------
ALTER TABLE public.products
  ADD CONSTRAINT products_store_id_slug_key UNIQUE (store_id, slug);

-- ----------------------------------------------------------------
-- 3. Recreate a supporting index for slug-only lookups
--    (storefront queries often look up by slug alone without store_id)
-- ----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS products_slug_idx ON public.products (slug);

COMMIT;
