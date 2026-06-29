-- Migration: Add review UNIQUE constraint and storage bucket policies
-- Date: 2026-06-29
-- Safe to run on production: YES

BEGIN;

-- Add DB-level UNIQUE constraint for reviews (defense-in-depth)
-- Application code already prevents duplicates, but DB constraint adds safety
ALTER TABLE public.reviews
DROP CONSTRAINT IF EXISTS reviews_product_buyer_unique;

ALTER TABLE public.reviews
ADD CONSTRAINT reviews_product_buyer_unique
UNIQUE (product_id, buyer_id);

-- Add FOR UPDATE policy on products storage bucket for creators
DROP POLICY IF EXISTS "creators update own files" ON storage.objects;

CREATE POLICY "creators update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'products' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "creators delete own files" ON storage.objects;

CREATE POLICY "creators delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'products' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

COMMIT;
