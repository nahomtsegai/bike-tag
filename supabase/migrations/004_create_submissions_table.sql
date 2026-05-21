create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),

  active_tag_id uuid not null references public.tags(id),

  rider_name text not null,
  found_location_map_url text not null,
  match_photo_url text not null,

  next_title text not null,
  next_clue text not null,
  next_hidden_location_map_url text not null,
  next_tag_photo_url text not null,

  status text not null default 'pending',
  rejection_reason text,

  reviewed_at timestamptz,
  reviewed_by text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint submissions_status_check
    check (status in ('pending', 'approved', 'rejected')),

  constraint submissions_rider_name_length_check
    check (char_length(btrim(rider_name)) between 1 and 50),

  constraint submissions_next_title_length_check
    check (char_length(btrim(next_title)) between 1 and 80),

  constraint submissions_next_clue_length_check
    check (char_length(btrim(next_clue)) between 1 and 500),

  constraint submissions_found_location_map_url_length_check
    check (char_length(btrim(found_location_map_url)) between 1 and 2048),

  constraint submissions_next_hidden_location_map_url_length_check
    check (
      char_length(btrim(next_hidden_location_map_url)) between 1 and 2048
    ),

  constraint submissions_match_photo_url_length_check
    check (char_length(btrim(match_photo_url)) between 1 and 2048),

  constraint submissions_next_tag_photo_url_length_check
    check (char_length(btrim(next_tag_photo_url)) between 1 and 2048),

  constraint submissions_rejection_reason_length_check
    check (
      rejection_reason is null
      or char_length(btrim(rejection_reason)) <= 500
    ),

  constraint submissions_reviewed_fields_check
    check (
      (
        status = 'pending'
        and reviewed_at is null
      )
      or (
        status in ('approved', 'rejected')
        and reviewed_at is not null
      )
    )
);

create index if not exists submissions_status_idx
on public.submissions (status);

create index if not exists submissions_active_tag_id_idx
on public.submissions (active_tag_id);

create index if not exists submissions_created_at_idx
on public.submissions (created_at desc);

create index if not exists submissions_reviewed_at_idx
on public.submissions (reviewed_at desc);

create or replace trigger update_submissions_updated_at
before update on public.submissions
for each row
execute function public.update_updated_at_column();

grant usage on schema public to service_role;

grant select, insert, update, delete
on public.submissions
to service_role;