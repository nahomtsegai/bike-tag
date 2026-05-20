create extension if not exists pgcrypto;

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),

  title text not null,
  clue text not null,

  tag_photo_url text not null,
  match_photo_url text,

  location_map_url text,
  hidden_location_map_url text,

  found_by text not null,

  status text not null default 'active',

  created_at timestamptz not null default now(),
  found_at timestamptz,

  created_by_user_id uuid,
  found_by_user_id uuid,

  inserted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint tags_status_check
    check (status in ('active', 'found')),

  constraint tags_title_length_check
    check (char_length(title) <= 80),

  constraint tags_clue_length_check
    check (char_length(clue) <= 500),

  constraint tags_found_by_length_check
    check (char_length(found_by) <= 50)
);

create unique index if not exists one_active_tag
on public.tags ((status))
where status = 'active';

create index if not exists tags_status_idx
on public.tags (status);

create index if not exists tags_created_at_idx
on public.tags (created_at desc);

create index if not exists tags_found_at_idx
on public.tags (found_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_tags_updated_at on public.tags;

create trigger set_tags_updated_at
before update on public.tags
for each row
execute function public.set_updated_at();

insert into public.tags (
  id,
  title,
  clue,
  tag_photo_url,
  match_photo_url,
  location_map_url,
  hidden_location_map_url,
  found_by,
  status,
  created_at,
  found_at
)
values
  (
    '00000000-0000-0000-0000-000000000001',
    'Find the overlook',
    'A quiet climb with one of the best views in the city.',
    '',
    null,
    null,
    'https://www.google.com/maps/search/?api=1&query=Iroquois%20Park%20overlook',
    'Sample Rider',
    'active',
    '2026-05-17T14:00:00.000Z',
    null
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'River trail mural',
    'Look for the painted wall near the path.',
    '',
    '',
    'https://www.google.com/maps/search/?api=1&query=River%20trail',
    null,
    'Sample Rider',
    'found',
    '2026-05-10T14:00:00.000Z',
    '2026-05-10T14:00:00.000Z'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Coffee stop corner',
    'A good place to refuel after a morning ride.',
    '',
    '',
    'https://www.google.com/maps/search/?api=1&query=Neighborhood%20coffee%20shop',
    null,
    'Sample Rider',
    'found',
    '2026-05-03T14:00:00.000Z',
    '2026-05-03T14:00:00.000Z'
  )
on conflict (id) do nothing;