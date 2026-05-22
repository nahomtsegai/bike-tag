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
  v_submission_id uuid;
begin
  if p_submission_id is null then
    raise exception 'Submission id is required.';
  end if;

  if p_reviewed_by is null or btrim(p_reviewed_by) = '' then
    raise exception 'Reviewer is required.';
  end if;

  if p_rejection_reason is not null
    and char_length(btrim(p_rejection_reason)) > 500 then
    raise exception 'Rejection reason is too long.';
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
    raise exception 'Pending submission not found.';
  end if;

  return query
  select v_submission_id;
end;
$$;

grant execute on function public.reject_submission(
  uuid,
  text,
  text
) to service_role;

notify pgrst, 'reload schema';