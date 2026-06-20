create table if not exists public.storage_cleanup_runs (
  id uuid primary key default gen_random_uuid(),
  environment text not null,
  status text not null check (status in ('succeeded', 'failed')),
  mode text not null default 'dry-run' check (mode = 'dry-run'),
  grace_period_days integer,
  scanned_file_count integer,
  referenced_file_count integer,
  skipped_recent_file_count integer,
  skipped_missing_timestamp_count integer,
  candidate_count integer,
  candidate_size_bytes bigint,
  error_message text,
  started_at timestamptz not null,
  completed_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint storage_cleanup_runs_nonnegative_counts check (
    (scanned_file_count is null or scanned_file_count >= 0)
    and (referenced_file_count is null or referenced_file_count >= 0)
    and (skipped_recent_file_count is null or skipped_recent_file_count >= 0)
    and (skipped_missing_timestamp_count is null or skipped_missing_timestamp_count >= 0)
    and (candidate_count is null or candidate_count >= 0)
    and (candidate_size_bytes is null or candidate_size_bytes >= 0)
  )
);

create index if not exists storage_cleanup_runs_environment_completed_at_idx
  on public.storage_cleanup_runs (environment, completed_at desc);

alter table public.storage_cleanup_runs enable row level security;

revoke all on table public.storage_cleanup_runs from anon, authenticated;
grant all on table public.storage_cleanup_runs to service_role;
