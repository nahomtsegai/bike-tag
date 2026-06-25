revoke all
on table
  public.tags,
  public.submissions,
  public.submit_diagnostic_events,
  public.admin_users
from public, anon, authenticated;

grant select, insert, update, delete
on table
  public.tags,
  public.submissions,
  public.submit_diagnostic_events,
  public.admin_users
to service_role;

create index if not exists submission_notification_attempts_retry_of_id_idx
  on public.submission_notification_attempts (retry_of_id);

notify pgrst, 'reload schema';
