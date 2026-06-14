insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'bike_tag_pending_photos',
  'bike_tag_pending_photos',
  false,
  8388608,
  array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.submissions
add column if not exists match_photo_storage_path text,
add column if not exists next_tag_photo_storage_path text;

alter table public.submissions
alter column match_photo_url drop not null,
alter column next_tag_photo_url drop not null;

alter table public.submissions
drop constraint if exists submissions_match_photo_storage_path_length_check,
add constraint submissions_match_photo_storage_path_length_check
  check (
    match_photo_storage_path is null
    or char_length(btrim(match_photo_storage_path)) between 1 and 1024
  ),
drop constraint if exists submissions_next_tag_photo_storage_path_length_check,
add constraint submissions_next_tag_photo_storage_path_length_check
  check (
    next_tag_photo_storage_path is null
    or char_length(btrim(next_tag_photo_storage_path)) between 1 and 1024
  ),
drop constraint if exists submissions_match_photo_reference_check,
add constraint submissions_match_photo_reference_check
  check (
    nullif(btrim(match_photo_url), '') is not null
    or nullif(btrim(match_photo_storage_path), '') is not null
  ),
drop constraint if exists submissions_next_tag_photo_reference_check,
add constraint submissions_next_tag_photo_reference_check
  check (
    nullif(btrim(next_tag_photo_url), '') is not null
    or nullif(btrim(next_tag_photo_storage_path), '') is not null
  );

comment on column public.submissions.match_photo_storage_path is
  'Private Supabase Storage object path for a pending match photo.';

comment on column public.submissions.next_tag_photo_storage_path is
  'Private Supabase Storage object path for a pending next-tag photo.';

notify pgrst, 'reload schema';
