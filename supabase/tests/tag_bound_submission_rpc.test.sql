begin;

create extension if not exists pgtap with schema extensions;

select plan(9);

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
  '11111111-1111-4111-8111-111111111111'::uuid,
  'Bound submission active tag',
  'Bound submission clue',
  'https://example.com/bound-active-tag.jpg',
  'CI',
  'active',
  '2026-06-17T12:00:00Z'::timestamptz
);

create temporary table first_bound_call_result on commit drop as
select *
from public.create_tag_bound_idempotent_private_pending_submission(
  '22222222-2222-4222-8222-222222222222'::uuid,
  '11111111-1111-4111-8111-111111111111'::uuid,
  'Bound CI Rider',
  'https://www.google.com/maps/search/?api=1&query=38.2527,-85.7585',
  'pending/bound/match-photo.jpg',
  'Bound CI Next Tag',
  'Tag-bound retry coverage',
  'https://www.google.com/maps/search/?api=1&query=38.2412,-85.7217',
  'pending/bound/next-tag-photo.jpg',
  38.2527,
  -85.7585,
  10,
  '2026-06-17T12:00:00Z'::timestamptz,
  38.2412,
  -85.7217,
  10,
  '2026-06-17T12:00:00Z'::timestamptz
);

create temporary table retry_bound_call_result on commit drop as
select *
from public.create_tag_bound_idempotent_private_pending_submission(
  '22222222-2222-4222-8222-222222222222'::uuid,
  '11111111-1111-4111-8111-111111111111'::uuid,
  'Bound CI Rider',
  'https://www.google.com/maps/search/?api=1&query=38.2527,-85.7585',
  'pending/bound/match-photo.jpg',
  'Bound CI Next Tag',
  'Tag-bound retry coverage',
  'https://www.google.com/maps/search/?api=1&query=38.2412,-85.7217',
  'pending/bound/next-tag-photo.jpg',
  38.2527,
  -85.7585,
  10,
  '2026-06-17T12:00:00Z'::timestamptz,
  38.2412,
  -85.7217,
  10,
  '2026-06-17T12:00:00Z'::timestamptz
);

select ok(
  (select was_created from first_bound_call_result),
  'the first tag-bound RPC call creates a pending submission'
);

select is(
  (select active_tag_id from first_bound_call_result),
  '11111111-1111-4111-8111-111111111111'::uuid,
  'the submission is bound to the expected active tag'
);

select ok(
  not (select was_created from retry_bound_call_result),
  'the tag-bound retry returns the existing submission'
);

select is(
  (select submission_id from retry_bound_call_result),
  (select submission_id from first_bound_call_result),
  'the tag-bound retry returns the same submission id'
);

select is(
  (
    select count(*)::integer
    from public.submissions
    where client_submission_id = '22222222-2222-4222-8222-222222222222'::uuid
  ),
  1,
  'only one tag-bound submission is stored for the client submission id'
);

update public.tags
set status = 'found'
where id = '11111111-1111-4111-8111-111111111111'::uuid;

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
  '33333333-3333-4333-8333-333333333333'::uuid,
  'Replacement active tag',
  'Replacement clue',
  'https://example.com/replacement-active-tag.jpg',
  'CI',
  'active',
  '2026-06-17T12:05:00Z'::timestamptz
);

create or replace function pg_temp.capture_stale_tag_submission_error()
returns text
language plpgsql
as $$
begin
  perform *
  from public.create_tag_bound_idempotent_private_pending_submission(
    '44444444-4444-4444-8444-444444444444'::uuid,
    '11111111-1111-4111-8111-111111111111'::uuid,
    'Stale CI Rider',
    'https://www.google.com/maps/search/?api=1&query=38.2527,-85.7585',
    'pending/stale/match-photo.jpg',
    'Stale CI Next Tag',
    'This submission should be rejected',
    'https://www.google.com/maps/search/?api=1&query=38.2412,-85.7217',
    'pending/stale/next-tag-photo.jpg',
    38.2527,
    -85.7585,
    10,
    '2026-06-17T12:00:00Z'::timestamptz,
    38.2412,
    -85.7217,
    10,
    '2026-06-17T12:00:00Z'::timestamptz
  );

  return null;
exception
  when others then
    return sqlerrm;
end;
$$;

select is(
  pg_temp.capture_stale_tag_submission_error(),
  'ACTIVE_TAG_CHANGED'::text,
  'a stale expected active tag is rejected'
);

select is(
  (
    select count(*)::integer
    from public.submissions
    where client_submission_id = '44444444-4444-4444-8444-444444444444'::uuid
  ),
  0,
  'a stale tag request does not create a submission row'
);

select ok(
  has_function_privilege(
    'service_role',
    'public.create_tag_bound_idempotent_private_pending_submission(uuid,uuid,text,text,text,text,text,text,text,numeric,numeric,numeric,timestamptz,numeric,numeric,numeric,timestamptz)',
    'EXECUTE'
  ),
  'service_role can execute the tag-bound submission RPC'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.create_tag_bound_idempotent_private_pending_submission(uuid,uuid,text,text,text,text,text,text,text,numeric,numeric,numeric,timestamptz,numeric,numeric,numeric,timestamptz)',
    'EXECUTE'
  ),
  'anon cannot execute the tag-bound submission RPC'
);

select * from finish();

rollback;
