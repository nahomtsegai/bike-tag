drop function if exists public.create_pending_submission(
  text,
  text,
  text,
  text,
  text,
  text,
  text
);

drop function if exists public.create_pending_submission(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  double precision,
  double precision,
  double precision,
  timestamp with time zone,
  double precision,
  double precision,
  double precision,
  timestamp with time zone
);

drop function if exists public.create_pending_submission(
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
  timestamp with time zone,
  numeric,
  numeric,
  numeric,
  timestamp with time zone
);

create or replace function public.create_pending_submission(
  p_rider_name text,
  p_found_location_map_url text,
  p_match_photo_url text,
  p_next_title text,
  p_next_clue text,
  p_next_hidden_location_map_url text,
  p_next_tag_photo_url text,
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
set search_path = public
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

  if p_match_photo_url is null or btrim(p_match_photo_url) = '' then
    raise exception 'Matching photo URL is required.';
  end if;

  if p_next_title is null or btrim(p_next_title) = '' then
    raise exception 'Next tag title is required.';
  end if;

  if p_next_clue is null or btrim(p_next_clue) = '' then
    raise exception 'Next tag clue is required.';
  end if;

  if p_next_hidden_location_map_url is null or btrim(p_next_hidden_location_map_url) = '' then
    raise exception 'Hidden location map link is required.';
  end if;

  if p_next_tag_photo_url is null or btrim(p_next_tag_photo_url) = '' then
    raise exception 'Next tag photo URL is required.';
  end if;

  select id
  into v_active_tag_id
  from public.tags
  where status = 'active'
  order by created_at desc
  limit 1;

  if v_active_tag_id is null then
    raise exception 'No active tag found.';
  end if;

  insert into public.submissions (
    active_tag_id,
    rider_name,
    found_location_map_url,
    match_photo_url,
    next_title,
    next_clue,
    next_hidden_location_map_url,
    next_tag_photo_url,
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
    btrim(p_match_photo_url),
    btrim(p_next_title),
    btrim(p_next_clue),
    btrim(p_next_hidden_location_map_url),
    btrim(p_next_tag_photo_url),
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

grant execute on function public.create_pending_submission(
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

notify pgrst, 'reload schema';