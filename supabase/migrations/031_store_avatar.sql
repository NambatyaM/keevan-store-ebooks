-- 031_store_avatar.sql
-- Adds avatar support for creator stores

BEGIN;

-- Add avatar column to stores
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS avatar_path text;

-- Storage bucket for store avatars
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do nothing;

-- Allow authenticated creators to upload avatars
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'creators upload avatars' AND tablename = 'objects') THEN
    create policy "creators upload avatars"
    on storage.objects
    for insert
    to authenticated
    with check (bucket_id = 'avatars');
  END IF;
END $$;

-- Allow authenticated creators to manage (update/delete) their avatars
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'creators manage avatars' AND tablename = 'objects') THEN
    create policy "creators manage avatars"
    on storage.objects
    for all
    to authenticated
    using (bucket_id = 'avatars')
    with check (bucket_id = 'avatars');
  END IF;
END $$;

-- Public can view avatars
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public view avatars' AND tablename = 'objects') THEN
    create policy "public view avatars"
    on storage.objects
    for select
    to public
    using (bucket_id = 'avatars');
  END IF;
END $$;

COMMIT;
