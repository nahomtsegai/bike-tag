alter table public.submissions
add column if not exists archived_at timestamp with time zone;

create index if not exists submissions_archived_at_idx
on public.submissions (archived_at);