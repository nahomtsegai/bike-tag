alter table public.submissions
  drop constraint if exists submissions_status_check;

alter table public.submissions
  add constraint submissions_status_check
  check (status in ('pending', 'approved', 'rejected', 'superseded'));

alter table public.submissions
  drop constraint if exists submissions_reviewed_fields_check;

alter table public.submissions
  add constraint submissions_reviewed_fields_check
  check (
    (
      status = 'pending'
      and reviewed_at is null
    )
    or (
      status in ('approved', 'rejected', 'superseded')
      and reviewed_at is not null
    )
  );

create index if not exists submissions_active_tag_status_idx
on public.submissions (active_tag_id, status);

create or replace function public.approve_submission_and_supersede_competitors(
  p_submission_id uuid,
  p_reviewed_by text,
  p_match_photo_url text,
  p_next_tag_photo_url text
)
returns table (
  submission_id uuid,
  found_tag_id uuid,
  current_tag_id uuid,
  superseded_submissions jsonb
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_submission public.submissions%rowtype;
  v_found_tag_id uuid;
  v_current_tag_id uuid;
  v_superseded_submissions jsonb := '[]'::jsonb;
begin
  if p_submission_id is null then
    raise exception 'SUBMISSION_ID_REQUIRED';
  end if;

  if p_reviewed_by is null or btrim(p_reviewed_by) = '' then
    raise exception 'REVIEWER_REQUIRED';
  end if;

  if p_match_photo_url is null or btrim(p_match_photo_url) = '' then
    raise exception 'MATCH_PHOTO_URL_REQUIRED';
  end if;

  if p_next_tag_photo_url is null or btrim(p_next_tag_photo_url) = '' then
    raise exception 'NEXT_TAG_PHOTO_URL_REQUIRED';
  end if;

  select *
  into v_submission
  from public.submissions
  where id = p_submission_id;

  if v_submission.id is null then
    raise exception 'SUBMISSION_NOT_FOUND';
  end if;

  if v_submission.status <> 'pending' then
    raise exception 'SUBMISSION_NOT_PENDING';
  end if;

  perform 1
  from public.tags
  where id = v_submission.active_tag_id
    and status = 'active'
  for update;

  if not found then
    raise exception 'ACTIVE_TAG_NOT_ACTIVE';
  end if;

  perform id
  from public.submissions
  where active_tag_id = v_submission.active_tag_id
    and status = 'pending'
  order by id
  for update;

  select *
  into v_submission
  from public.submissions
  where id = p_submission_id;

  if v_submission.status <> 'pending' then
    raise exception 'SUBMISSION_NOT_PENDING';
  end if;

  update public.tags
  set
    status = 'found',
    found_by = v_submission.rider_name,
    location_map_url = v_submission.found_location_map_url,
    match_photo_url = btrim(p_match_photo_url),
    found_latitude = v_submission.found_latitude,
    found_longitude = v_submission.found_longitude,
    found_location_accuracy_meters = v_submission.found_location_accuracy_meters,
    found_location_captured_at = v_submission.found_location_captured_at,
    found_at = now()
  where id = v_submission.active_tag_id
    and status = 'active'
  returning id into v_found_tag_id;

  if v_found_tag_id is null then
    raise exception 'ACTIVE_TAG_UPDATE_FAILED';
  end if;

  insert into public.tags (
    title,
    clue,
    tag_photo_url,
    match_photo_url,
    location_map_url,
    hidden_location_map_url,
    hidden_latitude,
    hidden_longitude,
    hidden_location_accuracy_meters,
    hidden_location_captured_at,
    found_by,
    status,
    created_at,
    found_at
  )
  values (
    v_submission.next_title,
    v_submission.next_clue,
    btrim(p_next_tag_photo_url),
    null,
    null,
    v_submission.next_hidden_location_map_url,
    v_submission.next_hidden_latitude,
    v_submission.next_hidden_longitude,
    v_submission.next_hidden_location_accuracy_meters,
    v_submission.next_hidden_location_captured_at,
    v_submission.rider_name,
    'active',
    now(),
    null
  )
  returning id into v_current_tag_id;

  update public.submissions
  set
    match_photo_url = btrim(p_match_photo_url),
    match_photo_storage_path = null,
    next_tag_photo_url = btrim(p_next_tag_photo_url),
    next_tag_photo_storage_path = null,
    status = 'approved',
    rejection_reason = null,
    reviewed_at = now(),
    reviewed_by = btrim(p_reviewed_by)
  where id = v_submission.id;

  with competing_submissions as (
    select
      id,
      match_photo_storage_path,
      next_tag_photo_storage_path
    from public.submissions
    where active_tag_id = v_submission.active_tag_id
      and id <> v_submission.id
      and status = 'pending'
  ), superseded as (
    update public.submissions as submission
    set
      match_photo_storage_path = null,
      next_tag_photo_storage_path = null,
      status = 'superseded',
      rejection_reason = 'Another submission for this tag was approved first.',
      reviewed_at = now(),
      reviewed_by = btrim(p_reviewed_by)
    from competing_submissions as competing
    where submission.id = competing.id
    returning
      competing.id,
      competing.match_photo_storage_path,
      competing.next_tag_photo_storage_path
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'submission_id', id,
        'match_photo_storage_path', match_photo_storage_path,
        'next_tag_photo_storage_path', next_tag_photo_storage_path
      )
      order by id
    ),
    '[]'::jsonb
  )
  into v_superseded_submissions
  from superseded;

  return query
  select
    v_submission.id,
    v_found_tag_id,
    v_current_tag_id,
    v_superseded_submissions;
end;
$$;

revoke execute on function public.approve_submission_and_supersede_competitors(
  uuid,
  text,
  text,
  text
)
from public, anon, authenticated;

grant execute on function public.approve_submission_and_supersede_competitors(
  uuid,
  text,
  text,
  text
)
to service_role;

notify pgrst, 'reload schema';
