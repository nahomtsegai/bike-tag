create or replace function public.create_idempotent_private_pending_submission(
  p_client_submission_id uuid,
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
  active_tag_id uuid,
  was_created boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_active_tag_id uuid;
  v_submission_id uuid;
  v_was_created boolean := false;
begin
  if p_client_submission_id is null then
    raise exception 'Client submission ID is required.';
  end if;

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

  select
    existing_submission.id,
    existing_submission.active_tag_id
  into
    v_submission_id,
    v_active_tag_id
  from public.submissions as existing_submission
  where existing_submission.client_submission_id = p_client_submission_id
  limit 1;

  if v_submission_id is not null then
    return query
    select v_submission_id, v_active_tag_id, false;
    return;
  end if;

  select active_tag.id
  into v_active_tag_id
  from public.tags as active_tag
  where active_tag.status = 'active'
  order by active_tag.created_at desc
  limit 1
  for update;

  if v_active_tag_id is null then
    raise exception 'No active tag found.';
  end if;

  insert into public.submissions (
    client_submission_id,
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
    p_client_submission_id,
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
  on conflict (client_submission_id)
  where client_submission_id is not null
  do nothing
  returning id into v_submission_id;

  if v_submission_id is not null then
    v_was_created := true;
  else
    select
      existing_submission.id,
      existing_submission.active_tag_id
    into
      v_submission_id,
      v_active_tag_id
    from public.submissions as existing_submission
    where existing_submission.client_submission_id = p_client_submission_id
    limit 1;
  end if;

  if v_submission_id is null then
    raise exception 'Could not create or load idempotent submission.';
  end if;

  return query
  select v_submission_id, v_active_tag_id, v_was_created;
end;
$$;

revoke execute on function public.create_idempotent_private_pending_submission(
  uuid,
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

grant execute on function public.create_idempotent_private_pending_submission(
  uuid,
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
to service_role;

notify pgrst, 'reload schema';
