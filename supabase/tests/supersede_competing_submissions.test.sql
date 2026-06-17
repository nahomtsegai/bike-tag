begin;

create extension if not exists pgtap with schema extensions;

select plan(12);

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
  'Competing submission active tag',
  'Competing submission clue',
  'https://example.com/active-tag.jpg',
  'CI',
  'active',
  '2026-06-17T18:00:00Z'::timestamptz
);

create temporary table winner_result on commit drop as
select *
from public.create_tag_bound_idempotent_private_pending_submission(
  '22222222-2222-4222-8222-222222222222'::uuid,
  '11111111-1111-4111-8111-111111111111'::uuid,
  'Winning Rider',
  'https://www.google.com/maps/search/?api=1&query=38.2527,-85.7585',
  'pending/winner/match-photo.jpg',
  'Winning next tag',
  'Winning next clue',
  'https://www.google.com/maps/search/?api=1&query=38.2412,-85.7217',
  'pending/winner/next-tag-photo.jpg',
  38.2527,
  -85.7585,
  10,
  '2026-06-17T18:00:00Z'::timestamptz,
  38.2412,
  -85.7217,
  10,
  '2026-06-17T18:00:00Z'::timestamptz
);

create temporary table competitor_result on commit drop as
select *
from public.create_tag_bound_idempotent_private_pending_submission(
  '33333333-3333-4333-8333-333333333333'::uuid,
  '11111111-1111-4111-8111-111111111111'::uuid,
  'Competing Rider',
  'https://www.google.com/maps/search/?api=1&query=38.2528,-85.7586',
  'pending/competitor/match-photo.jpg',
  'Competing next tag',
  'Competing next clue',
  'https://www.google.com/maps/search/?api=1&query=38.2413,-85.7218',
  'pending/competitor/next-tag-photo.jpg',
  38.2528,
  -85.7586,
  10,
  '2026-06-17T18:01:00Z'::timestamptz,
  38.2413,
  -85.7218,
  10,
  '2026-06-17T18:01:00Z'::timestamptz
);

create temporary table approval_result on commit drop as
select *
from public.approve_submission_with_public_photos(
  (select submission_id from winner_result),
  'CI Admin',
  'https://example.com/public/winner-match.jpg',
  'https://example.com/public/winner-next.jpg'
);

select is(
  (
    select status
    from public.submissions
    where id = (select submission_id from winner_result)
  ),
  'approved'::text,
  'the winning submission is approved'
);

select is(
  (
    select status
    from public.submissions
    where id = (select submission_id from competitor_result)
  ),
  'superseded'::text,
  'the competing submission is superseded'
);

select is(
  (
    select rejection_reason
    from public.submissions
    where id = (select submission_id from competitor_result)
  ),
  'Another submission for this tag was approved first.'::text,
  'the superseded submission records a clear system reason'
);

select is(
  (
    select reviewed_by
    from public.submissions
    where id = (select submission_id from competitor_result)
  ),
  'CI Admin'::text,
  'the superseded submission records the approving reviewer'
);

select ok(
  (
    select reviewed_at is not null
    from public.submissions
    where id = (select submission_id from competitor_result)
  ),
  'the superseded submission records its review time'
);

select is(
  (
    select match_photo_storage_path
    from public.submissions
    where id = (select submission_id from competitor_result)
  ),
  null::text,
  'the superseded match photo path is detached'
);

select is(
  (
    select next_tag_photo_storage_path
    from public.submissions
    where id = (select submission_id from competitor_result)
  ),
  null::text,
  'the superseded next-tag photo path is detached'
);

select is(
  jsonb_array_length(
    (select superseded_submissions from approval_result)
  ),
  1,
  'the approval RPC returns one superseded submission for cleanup'
);

select is(
  (
    select superseded_submissions -> 0 ->> 'submission_id'
    from approval_result
  ),
  (select submission_id::text from competitor_result),
  'the cleanup metadata identifies the superseded submission'
);

select is(
  (
    select superseded_submissions -> 0 ->> 'match_photo_storage_path'
    from approval_result
  ),
  'pending/competitor/match-photo.jpg'::text,
  'the cleanup metadata preserves the old match photo path'
);

select ok(
  has_function_privilege(
    'service_role',
    'public.approve_submission_with_public_photos(uuid,text,text,text)',
    'EXECUTE'
  ),
  'service_role can execute the superseding approval RPC'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.approve_submission_with_public_photos(uuid,text,text,text)',
    'EXECUTE'
  ),
  'anon cannot execute the superseding approval RPC'
);

select * from finish();

rollback;
