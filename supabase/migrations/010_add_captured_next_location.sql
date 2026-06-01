alter table public.submissions
  add column if not exists next_hidden_latitude double precision,
  add column if not exists next_hidden_longitude double precision,
  add column if not exists next_hidden_location_accuracy_meters double precision,
  add column if not exists next_hidden_location_captured_at timestamptz;

alter table public.tags
  add column if not exists hidden_latitude double precision,
  add column if not exists hidden_longitude double precision,
  add column if not exists hidden_location_accuracy_meters double precision,
  add column if not exists hidden_location_captured_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'submissions_next_hidden_latitude_range_check'
  ) then
    alter table public.submissions
      add constraint submissions_next_hidden_latitude_range_check
      check (
        next_hidden_latitude is null
        or next_hidden_latitude between -90 and 90
      );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'submissions_next_hidden_longitude_range_check'
  ) then
    alter table public.submissions
      add constraint submissions_next_hidden_longitude_range_check
      check (
        next_hidden_longitude is null
        or next_hidden_longitude between -180 and 180
      );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'submissions_next_hidden_location_accuracy_meters_check'
  ) then
    alter table public.submissions
      add constraint submissions_next_hidden_location_accuracy_meters_check
      check (
        next_hidden_location_accuracy_meters is null
        or next_hidden_location_accuracy_meters >= 0
      );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tags_hidden_latitude_range_check'
  ) then
    alter table public.tags
      add constraint tags_hidden_latitude_range_check
      check (
        hidden_latitude is null
        or hidden_latitude between -90 and 90
      );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tags_hidden_longitude_range_check'
  ) then
    alter table public.tags
      add constraint tags_hidden_longitude_range_check
      check (
        hidden_longitude is null
        or hidden_longitude between -180 and 180
      );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tags_hidden_location_accuracy_meters_check'
  ) then
    alter table public.tags
      add constraint tags_hidden_location_accuracy_meters_check
      check (
        hidden_location_accuracy_meters is null
        or hidden_location_accuracy_meters >= 0
      );
  end if;
end;
$$;

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
  timestamptz
);

create or replace function public.create_pending_submission(
  p_rider_name text,
  p_found_location_map_url text,
  p_match_photo_url text,
  p_next_title text,
  p_next_clue text,
  p_next_hidden_location_map_url text,
  p_next_tag_photo_url text,
  p_found_latitude double precision default null,
  p_found_longitude double precision default null,
  p_found_location_accuracy_meters double precision default null,
  p_found_location_captured_at timestamptz default null,
  p_next_hidden_latitude double precision default null,
  p_next_hidden_longitude double precision default null,
  p_next_hidden_location_accuracy_meters double precision default null,
  p_next_hidden_location_captured_at timestamptz default null
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

  if p_found_latitude is not null and (p_found_latitude < -90 or p_found_latitude > 90) then
    raise exception 'Found latitude is invalid.';
  end if;

  if p_found_longitude is not null and (p_found_longitude < -180 or p_found_longitude > 180) then
    raise exception 'Found longitude is invalid.';
  end if;

  if p_found_location_accuracy_meters is not null and p_found_location_accuracy_meters < 0 then
    raise exception 'Found location accuracy is invalid.';
  end if;

  if p_next_hidden_latitude is not null and (p_next_hidden_latitude < -90 or p_next_hidden_latitude > 90) then
    raise exception 'Next hidden latitude is invalid.';
  end if;

  if p_next_hidden_longitude is not null and (p_next_hidden_longitude < -180 or p_next_hidden_longitude > 180) then
    raise exception 'Next hidden longitude is invalid.';
  end if;

  if p_next_hidden_location_accuracy_meters is not null and p_next_hidden_location_accuracy_meters < 0 then
    raise exception 'Next hidden location accuracy is invalid.';
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

create or replace function public.approve_submission(
  p_submission_id uuid,
  p_reviewed_by text
)
returns table (
  submission_id uuid,
  found_tag_id uuid,
  current_tag_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_submission public.submissions%rowtype;
  v_found_tag_id uuid;
  v_current_tag_id uuid;
begin
  if p_submission_id is null then
    raise exception 'Submission id is required.';
  end if;

  if p_reviewed_by is null or btrim(p_reviewed_by) = '' then
    raise exception 'Reviewer is required.';
  end if;

  select *
  into v_submission
  from public.submissions
  where id = p_submission_id
    and status = 'pending'
  for update;

  if v_submission.id is null then
    raise exception 'Pending submission not found.';
  end if;

  perform 1
  from public.tags
  where id = v_submission.active_tag_id
    and status = 'active'
  for update;

  if not found then
    raise exception 'Related active tag is no longer active.';
  end if;

  update public.tags
  set
    status = 'found',
    found_by = v_submission.rider_name,
    location_map_url = v_submission.found_location_map_url,
    match_photo_url = v_submission.match_photo_url,
    found_latitude = v_submission.found_latitude,
    found_longitude = v_submission.found_longitude,
    found_location_accuracy_meters = v_submission.found_location_accuracy_meters,
    found_location_captured_at = v_submission.found_location_captured_at,
    found_at = now()
  where id = v_submission.active_tag_id
    and status = 'active'
  returning id into v_found_tag_id;

  if v_found_tag_id is null then
    raise exception 'Could not mark active tag as found.';
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
    v_submission.next_tag_photo_url,
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

grant execute on function public.create_pending_submission(
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
  timestamptz,
  double precision,
  double precision,
  double precision,
  timestamptz
) to service_role;

grant execute on function public.approve_submission(
  uuid,
  text
) to service_role;

notify pgrst, 'reload schema';