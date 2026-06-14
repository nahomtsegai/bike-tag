create or replace function public.create_private_pending_submission(
  p_rider_name text,
  p_found_location_map_url text,
  p_match_photo_storage_path text,
  p_next_title text,
  p_next_clue text,
  p_next_hidden_location_map_url text,
  p_next_tag_photo_storage_path text,
  p_found_latitude numeric,
  p_found_longitude numeric,
  p_found_location_accuracy_meters numeric,
  p_found_location_captured_at timestamptz,
  p_next_hidden_latitude numeric,
  p_next_hidden_longitude numeric,
  p_next_hidden_location_accuracy_meters numeric,
  p_next_hidden_location_captured_at timestamptz
)
returns table (
  submission_id uuid,
  active_tag_id uuid
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_active_tag_id uuid;
  v_submission_id uuid;
begin
  if p_rider_name is null or btrim(p_rider_name) = '' then
    raise exception 'Rider name is required.';
  end if;

  if p_found_location_map_url is null or btrim(p_found_location_map_url) = '' then
    raise exception 'Found location map link is required.';
  end if;

  if p_match_photo_storage_path is null
    or btrim(p_match_photo_storage_path) = '' then
    raise exception 'Matching photo storage path is required.';
  end if;

  if p_next_title is null or btrim(p_next_title) = '' then
    raise exception 'Next tag title is required.';
  end if;

  if p_next_clue is null or btrim(p_next_clue) = '' then
    raise exception 'Next tag clue is required.';
  end if;

  if p_next_hidden_location_map_url is null
    or btrim(p_next_hidden_location_map_url) = '' then
    raise exception 'Hidden location map link is required.';
  end if;

  if p_next_tag_photo_storage_path is null
    or btrim(p_next_tag_photo_storage_path) = '' then
    raise exception 'Next tag photo storage path is required.';
  end if;

  select id
  into v_active_tag_id
  from public.tags
  where status = 'active'
  order by created_at desc
  limit 1
  for update;

  if v_active_tag_id is null then
    raise exception 'No active tag found.';
  end if;

  insert into public.submissions (
    active_tag_id,
    rider_name,
    found_location_map_url,
    match_photo_url,
    match_photo_storage_path,
    next_title,
    next_clue,
    next_hidden_location_map_url,
    next_tag_photo_url,
    next_tag_photo_storage_path,
    found_latitude,
    found_longitude,
    found_location_accuracy_meters,
    found_location_captured_at,
    next_hidden_latitude,
    next_hidden_longitude,
    next_hidden_location_accuracy_meters,
    next_hidden_location_captured_at,
    status
  )
  values (
    v_active_tag_id,
    btrim(p_rider_name),
    btrim(p_found_location_map_url),
    null,
    btrim(p_match_photo_storage_path),
    btrim(p_next_title),
    btrim(p_next_clue),
    btrim(p_next_hidden_location_map_url),
    null,
    btrim(p_next_tag_photo_storage_path),
    p_found_latitude,
    p_found_longitude,
    p_found_location_accuracy_meters,
    p_found_location_captured_at,
    p_next_hidden_latitude,
    p_next_hidden_longitude,
    p_next_hidden_location_accuracy_meters,
    p_next_hidden_location_captured_at,
    'pending'
  )
  returning id into v_submission_id;

  return query
  select
    v_submission_id,
    v_active_tag_id;
end;
$$;

create or replace function public.approve_submission_with_public_photos(
  p_submission_id uuid,
  p_reviewed_by text,
  p_match_photo_url text,
  p_next_tag_photo_url text
)
returns table (
  submission_id uuid,
  found_tag_id uuid,
  current_tag_id uuid
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_submission public.submissions%rowtype;
  v_found_tag_id uuid;
  v_current_tag_id uuid;
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
  where id = p_submission_id
  for update;

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
    reviewed_at = now(),
    reviewed_by = btrim(p_reviewed_by)
  where id = v_submission.id;

  return query
  select
    v_submission.id,
    v_found_tag_id,
    v_current_tag_id;
end;
$$;

revoke execute on function public.create_private_pending_submission(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  numeric,
  numeric,
  numeric,
  timestamptz,
  numeric,
  numeric,
  numeric,
  timestamptz
)
from public, anon, authenticated;

grant execute on function public.create_private_pending_submission(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  numeric,
  numeric,
  numeric,
  timestamptz,
  numeric,
  numeric,
  numeric,
  timestamptz
) to service_role;

revoke execute on function public.approve_submission_with_public_photos(
  uuid,
  text,
  text,
  text
)
from public, anon, authenticated;

grant execute on function public.approve_submission_with_public_photos(
  uuid,
  text,
  text,
  text
) to service_role;

notify pgrst, 'reload schema';
