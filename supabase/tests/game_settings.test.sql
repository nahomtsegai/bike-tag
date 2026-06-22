begin;

create extension if not exists pgtap with schema extensions;

select plan(4);

select is(
  (
    select clue_unlock_delay_days
    from public.game_settings
    where id = true
  ),
  5::smallint,
  'the clue reveal delay defaults to five days'
);

update public.game_settings
set clue_unlock_delay_days = 2,
    updated_at = now()
where id = true;

select is(
  (
    select clue_unlock_delay_days
    from public.game_settings
    where id = true
  ),
  2::smallint,
  'the singleton clue reveal delay can be updated'
);

insert into public.tags (
  id,
  title,
  clue,
  tag_photo_url,
  found_by,
  status,
  created_at
)
values (
  '44444444-4444-4444-8444-444444444444'::uuid,
  'Configurable clue tag',
  'Configurable clue',
  'https://example.com/configurable-clue.jpg',
  'CI',
  'active',
  '2026-06-22T12:00:00Z'::timestamptz
);

select is(
  (
    select clue_unlocks_at
    from public.tags
    where id = '44444444-4444-4444-8444-444444444444'::uuid
  ),
  '2026-06-24T12:00:00Z'::timestamptz,
  'new tags snapshot the configured clue reveal delay'
);

insert into public.tags (
  id,
  title,
  clue,
  tag_photo_url,
  found_by,
  status,
  created_at,
  clue_unlocks_at
)
values (
  '55555555-5555-4555-8555-555555555555'::uuid,
  'Explicit clue tag',
  'Explicit clue',
  'https://example.com/explicit-clue.jpg',
  'CI',
  'found',
  '2026-06-22T12:00:00Z'::timestamptz,
  '2026-06-23T18:00:00Z'::timestamptz
);

select is(
  (
    select clue_unlocks_at
    from public.tags
    where id = '55555555-5555-4555-8555-555555555555'::uuid
  ),
  '2026-06-23T18:00:00Z'::timestamptz,
  'an explicit clue unlock timestamp is preserved'
);

select * from finish();

rollback;
