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
  'CI active tag',
  'CI clue',
  'https://example.com/ci-active-tag.jpg',
  'CI',
  'active',
  '2026-06-15T12:00:00Z'::timestamptz
);

create temporary table first_call_result on commit drop as
select *
from public.create_idempotent_private_pending_submission(
  '22222222-2222-4222-8222-222222222222'::uuid,
  'Migration CI Rider',
  'https://www.google.com/maps/search/?api=1&query=38.2527,-85.7585',
  'pending/ci/match-photo.jpg',
  'Migration CI Next Tag',
  'Migration-backed retry coverage',
  'https://www.google.com/maps/search/?api=1&query=38.2412,-85.7217',
  'pending/ci/next-tag-photo.jpg',
  38.2527,
  -85.7585,
  10,
  '2026-06-15T12:00:00Z'::timestamptz,
  38.2412,
  -85.7217,
  10,
  '2026-06-15T12:00:00Z'::timestamptz
);

create temporary table retry_call_result on commit drop as
select *
from public.create_idempotent_private_pending_submission(
  '22222222-2222-4222-8222-222222222222'::uuid,
  'Migration CI Rider',
  'https://www.google.com/maps/search/?api=1&query=38.2527,-85.7585',
  'pending/ci/match-photo.jpg',
  'Migration CI Next Tag',
  'Migration-backed retry coverage',
  'https://www.google.com/maps/search/?api=1&query=38.2412,-85.7217',
  'pending/ci/next-tag-photo.jpg',
  38.2527,
  -85.7585,
  10,
  '2026-06-15T12:00:00Z'::timestamptz,
  38.2412,
  -85.7217,
  10,
  '2026-06-15T12:00:00Z'::timestamptz
);

select ok(
  (select was_created from first_call_result),
  'the first idempotent RPC call creates a pending submission'
);

select ok(
  not (select was_created from retry_call_result),
  'the retry returns the existing pending submission'
);

select is(
  (select submission_id from retry_call_result),
  (select submission_id from first_call_result),
  'the retry returns the same submission id'
);

select is(
  (select active_tag_id from retry_call_result),
  (select active_tag_id from first_call_result),
  'the retry returns the same active tag id'
);

select is(
  (
    select count(*)::integer
    from public.submissions
    where client_submission_id = '22222222-2222-4222-8222-222222222222'::uuid
  ),
  1,
  'only one pending submission is stored for the client submission id'
);

select is(
  (
    select match_photo_storage_path
    from public.submissions
    where client_submission_id = '22222222-2222-4222-8222-222222222222'::uuid
  ),
  'pending/ci/match-photo.jpg'::text,
  'the pending photo storage path is persisted'
);

select ok(
  has_table_privilege(
    'service_role',
    'public.tags',
    'SELECT, INSERT, UPDATE, DELETE'
  ),
  'service_role can manage tags through the Data API'
);

select ok(
  has_function_privilege(
    'service_role',
    'public.create_idempotent_private_pending_submission(uuid,text,text,text,text,text,text,text,numeric,numeric,numeric,timestamptz,numeric,numeric,numeric,timestamptz)',
    'EXECUTE'
  ),
  'service_role can execute the private submission RPC'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.create_idempotent_private_pending_submission(uuid,text,text,text,text,text,text,text,numeric,numeric,numeric,timestamptz,numeric,numeric,numeric,timestamptz)',
    'EXECUTE'
  ),
  'anon cannot execute the private submission RPC'
);

select * from finish();

rollback;
