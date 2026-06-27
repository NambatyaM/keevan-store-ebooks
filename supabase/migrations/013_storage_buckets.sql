-- Storage bucket for product files (ebooks, PDFs, etc.)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'products',
  'products',
  false,
  4194304,
  array['application/pdf','application/epub+zip','application/x-mobipocket-ebook','application/zip','image/jpeg','image/png','image/webp']
)
on conflict (id) do nothing;

-- Storage bucket for product cover images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'covers',
  'covers',
  true,
  2097152,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do nothing;

-- Allow authenticated creators to upload to products bucket
create policy "creators upload products"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'products'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated creators to read their own uploads
create policy "creators read own products"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'products'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public to download via signed URLs (service role)
-- Public can view covers
create policy "public view covers"
on storage.objects
for select
to public
using (bucket_id = 'covers');

-- Allow authenticated creators to upload covers
create policy "creators upload covers"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'covers');

-- Allow authenticated creators to manage their covers
create policy "creators manage covers"
on storage.objects
for all
to authenticated
using (bucket_id = 'covers')
with check (bucket_id = 'covers');
