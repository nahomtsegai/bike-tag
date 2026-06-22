alter table public.tags
  add column if not exists replaced_at timestamptz;

alter table public.tags
  drop constraint if exists tags_status_check;

alter table public.tags
  add constraint tags_status_check
  check (status in ('active', 'found', 'replaced'));

alter table public.tags
  drop constraint if exists tags_replaced_at_check;

alter table public.tags
  add constraint tags_replaced_at_check
  check (
    (status = 'replaced' and replaced_at is not null)
    or (status <> 'replaced' and replaced_at is null)
  );

create index if not exists tags_replaced_at_idx
on public.tags (replaced_at desc)
where status = 'replaced';

drop function if exists public.replace_active_tag(
  text,
  text,
  text,
  text,
  text
);

create function public.replace_active_tag(
  p_title text,
  p_clue text,
  p_tag_photo_url text,
  p_hidden_location_map_url text,
  p_reviewed_by text
)
returns table (
  replaced_tag_id uuid,
  current_tag_id uuid,
  pending_submission_count integer,
  superseded_submissions jsonb
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_active_tag_id uuid;
  v_current_tag_id uuid;
  v_pending_submission_count integer := 0;
  v_superseded_submissions jsonb := '[]'::jsonb;
begin
  if p_title is null or btrim(p_title) = '' then
    raise exception 'TITLE_REQUIRED';
  end if;

  if char_length(btrim(p_title)) > 80 then
    raise exception 'TITLE_TOO_LONG';
  end if;

  if p_clue is null or btrim(p_clue) = '' then
    raise exception 'CLUE_REQUIRED';
  end if;

  if char_length(btrim(p_clue)) > 500 then
    raise exception 'CLUE_TOO_LONG';
  end if;

  if p_tag_photo_url is null or btrim(p_tag_photo_url) = '' then
    raise exception 'TAG_PHOTO_URL_REQUIRED';
  end if;

  if p_hidden_location_map_url is null or btrim(p_hidden_location_map_url) = '' then
    raise exception 'HIDDEN_LOCATION_URL_REQUIRED';
  end if;

  if p_reviewed_by is null or btrim(p_reviewed_by) = '' then
    raise exception 'REVIEWER_REQUIRED';
  end if;

  select id
  into v_active_tag_id
  from public.tags
  where status = 'active'
  order by created_at desc
  limit 1
  for update;

  if v_active_tag_id is null then
    raise exception 'ACTIVE_TAG_NOT_FOUND';
  end if;

  perform id
  from public.submissions
  where active_tag_id = v_active_tag_id
    and status = 'pending'
  order by id
  for update;

  with pending_submissions as (
    select
      id,
      match_photo_url,
      match_photo_storage_path,
      next_tag_photo_url,
      next_tag_photo_storage_path
    from public.submissions
    where active_tag_id = v_active_tag_id
      and status = 'pending'
  ), superseded as (
    update public.submissions as submission
    set
      match_photo_url = null,
      match_photo_storage_path = null,
      next_tag_photo_url = null,
      next_tag_photo_storage_path = null,
      status = 'superseded',
      rejection_reason = 'The current tag was replaced by an administrator.',
      reviewed_at = now(),
      reviewed_by = left(btrim(p_reviewed_by), 80)
    from pending_submissions as pending
    where submission.id = pending.id
    returning
      pending.id,
      pending.match_photo_url,
      pending.match_photo_storage_path,
      pending.next_tag_photo_url,
      pending.next_tag_photo_storage_path
  )
  select
    count(*)::integer,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'submission_id', id,
          'match_photo_url', match_photo_url,
          'match_photo_storage_path', match_photo_storage_path,
          'next_tag_photo_url', next_tag_photo_url,
          'next_tag_photo_storage_path', next_tag_photo_storage_path
        )
        order by id
      ),
      '[]'::jsonb
    )
  into
    v_pending_submission_count,
    v_superseded_submissions
  from superseded;

  update public.tags
  set
    status = 'replaced',
    replaced_at = now()
  where id = v_active_tag_id
    and status = 'active';

  if not found then
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
    found_at,
    replaced_at,
    found_latitude,
    found_longitude,
    found_location_accuracy_meters,
    found_location_captured_at
  )
  values (
    btrim(p_title),
    btrim(p_clue),
    btrim(p_tag_photo_url),
    null,
    null,
    btrim(p_hidden_location_map_url),
    'Admin',
    'active',
    null,
    null,
    null,
    null,
    null,
    null
  )
  returning id into v_current_tag_id;

  return query
  select
    v_active_tag_id,
    v_current_tag_id,
    v_pending_submission_count,
    v_superseded_submissions;
end;
$$;

revoke execute on function public.replace_active_tag(
  text,
  text,
  text,
  text,
  text
)
from public, anon, authenticated;

grant execute on function public.replace_active_tag(
  text,
  text,
  text,
  text,
  text
)
to service_role;

notify pgrst, 'reload schema';
