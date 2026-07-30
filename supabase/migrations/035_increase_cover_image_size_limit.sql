-- 035_increase_cover_image_size_limit.sql
-- Raise the cover image limit from 2 MB to 5 MB to avoid upload failures
-- caused by multipart form-data overhead and to support higher-quality covers.

alter table public.products
  drop constraint if exists products_cover_size_check,
  add constraint products_cover_size_check
    check (cover_size is null or cover_size <= 5242880);

update storage.buckets
  set file_size_limit = 5242880
  where id = 'covers';

