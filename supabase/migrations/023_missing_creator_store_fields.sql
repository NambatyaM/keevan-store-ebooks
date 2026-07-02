-- 023_missing_creator_store_fields.sql
-- Adds missing columns used by the creator settings page

BEGIN;

-- Creators: payout and notification fields
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS payout_method text;
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS mtn_number text;
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS airtel_number text;
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS bank_name text;
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS bank_account text;
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS account_name text;
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS notif_sale boolean NOT NULL DEFAULT true;
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS notif_withdrawal boolean NOT NULL DEFAULT true;
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS notif_refund boolean NOT NULL DEFAULT true;
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS notif_weekly boolean NOT NULL DEFAULT true;
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS notif_updates boolean NOT NULL DEFAULT false;

-- Stores: tagline, category, social_links
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS tagline text;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'E-books';
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS social_links jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMIT;
