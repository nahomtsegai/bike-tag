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
    raise exception 'SUBMISSION_ID_REQUIRED';
  end if;

  if p_reviewed_by is null or btrim(p_reviewed_by) = '' then
    raise exception 'REVIEWER_REQUIRED';
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
    match_photo_url = v_submission.match_photo_url,
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

create or replace function public.reject_submission(
  p_submission_id uuid,
  p_reviewed_by text,
  p_rejection_reason text default null
)
returns table (
  submission_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_submission public.submissions%rowtype;
  v_submission_id uuid;
begin
  if p_submission_id is null then
    raise exception 'SUBMISSION_ID_REQUIRED';
  end if;

  if p_reviewed_by is null or btrim(p_reviewed_by) = '' then
    raise exception 'REVIEWER_REQUIRED';
  end if;

  if p_rejection_reason is not null
    and char_length(btrim(p_rejection_reason)) > 500 then
    raise exception 'REJECTION_REASON_TOO_LONG';
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

  update public.submissions
  set
    status = 'rejected',
    rejection_reason = nullif(btrim(coalesce(p_rejection_reason, '')), ''),
    reviewed_at = now(),
    reviewed_by = btrim(p_reviewed_by)
  where id = p_submission_id
    and status = 'pending'
  returning id into v_submission_id;

  if v_submission_id is null then
    raise exception 'SUBMISSION_REJECT_FAILED';
  end if;

  return query
  select v_submission_id;
end;
$$;

grant execute on function public.approve_submission(
  uuid,
  text
) to service_role;

grant execute on function public.reject_submission(
  uuid,
  text,
  text
) to service_role;

notify pgrst, 'reload schema';