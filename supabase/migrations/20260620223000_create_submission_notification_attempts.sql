create table if not exists public.submission_notification_attempts (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  environment text not null,
  status text not null check (status in ('pending', 'sent', 'failed')),
  attempt_number integer not null check (attempt_number > 0),
  retry_of_id uuid references public.submission_notification_attempts(id) on delete set null,
  provider_message_id text,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (submission_id, attempt_number)
);

create unique index if not exists submission_notification_attempts_one_pending_idx
  on public.submission_notification_attempts (submission_id)
  where status = 'pending';

create index if not exists submission_notification_attempts_environment_created_idx
  on public.submission_notification_attempts (environment, created_at desc);

create index if not exists submission_notification_attempts_status_created_idx
  on public.submission_notification_attempts (status, created_at desc);

alter table public.submission_notification_attempts enable row level security;

revoke all on table public.submission_notification_attempts from anon, authenticated;
grant all on table public.submission_notification_attempts to service_role;

create or replace function public.create_submission_notification_attempt(
  p_submission_id uuid,
  p_environment text,
  p_retry_of_id uuid default null
)
returns table (id uuid, attempt_number integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_latest_id uuid;
  v_latest_status text;
  v_attempt_number integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_submission_id::text, 0));

  if not exists (
    select 1 from public.submissions where submissions.id = p_submission_id
  ) then
    raise exception 'Submission was not found.';
  end if;

  select attempts.id, attempts.status
  into v_latest_id, v_latest_status
  from public.submission_notification_attempts as attempts
  where attempts.submission_id = p_submission_id
  order by attempts.attempt_number desc
  limit 1;

  if p_retry_of_id is null then
    if v_latest_id is not null then
      raise exception 'A notification attempt already exists for this submission.';
    end if;
  elsif v_latest_id is distinct from p_retry_of_id or v_latest_status <> 'failed' then
    raise exception 'Only the latest failed notification attempt can be retried.';
  end if;

  select coalesce(max(attempts.attempt_number), 0) + 1
  into v_attempt_number
  from public.submission_notification_attempts as attempts
  where attempts.submission_id = p_submission_id;

  return query
  insert into public.submission_notification_attempts (
    submission_id,
    environment,
    status,
    attempt_number,
    retry_of_id
  ) values (
    p_submission_id,
    p_environment,
    'pending',
    v_attempt_number,
    p_retry_of_id
  )
  returning submission_notification_attempts.id,
    submission_notification_attempts.attempt_number;
end;
$$;

revoke all on function public.create_submission_notification_attempt(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.create_submission_notification_attempt(uuid, text, uuid) to service_role;
