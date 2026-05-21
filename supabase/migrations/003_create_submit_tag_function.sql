create or replace function public.submit_bike_tag(
  p_rider_name text,
  p_found_location_map_url text,
  p_match_photo_url text,
  p_next_title text,
  p_next_clue text,
  p_next_hidden_location_map_url text,
  p_next_tag_photo_url text
)
returns table (
  found_tag_id uuid,
  current_tag_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_found_tag_id uuid;
  v_current_tag_id uuid;
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

  update public.tags
  set
    status = 'found',
    found_by = btrim(p_rider_name),
    location_map_url = btrim(p_found_location_map_url),
    match_photo_url = btrim(p_match_photo_url),
    found_at = now()
  where status = 'active'
  returning id into v_found_tag_id;

  if v_found_tag_id is null then
    raise exception 'No active tag found.';
  end if;

  insert into public.tags (
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
  values (
    btrim(p_next_title),
    btrim(p_next_clue),
    btrim(p_next_tag_photo_url),
    null,
    null,
    btrim(p_next_hidden_location_map_url),
    btrim(p_rider_name),
    'active',
    now(),
    null
  )
  returning id into v_current_tag_id;

  return query
  select
    v_found_tag_id,
    v_current_tag_id;
end;
$$;

grant execute on function public.submit_bike_tag(
  text,
  text,
  text,
  text,
  text,
  text,
  text
) to service_role;