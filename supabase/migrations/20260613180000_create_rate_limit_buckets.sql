create table if not exists public.rate_limit_buckets (
  key_hash text primary key,
  request_count bigint not null,
  reset_at timestamptz not null,
  updated_at timestamptz not null default now(),

  constraint rate_limit_buckets_key_hash_format
    check (key_hash ~ '^[0-9a-f]{64}$'),

  constraint rate_limit_buckets_request_count_positive
    check (request_count >= 1)
);

create index if not exists rate_limit_buckets_reset_at_idx
on public.rate_limit_buckets (reset_at);

alter table public.rate_limit_buckets enable row level security;

revoke all
on table public.rate_limit_buckets
from public, anon, authenticated;

create or replace function public.consume_rate_limit(
  p_key_hash text,
  p_limit integer,
  p_window_ms bigint
)
returns table (
  allowed boolean,
  current_count bigint,
  bucket_reset_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_window interval;
  v_current_count bigint;
  v_reset_at timestamptz;
begin
  if p_key_hash is null
    or p_key_hash !~ '^[0-9a-f]{64}$'
  then
    raise exception 'A valid rate-limit key hash is required.';
  end if;

  if p_limit is null or p_limit <= 0 then
    raise exception 'Rate-limit request limit must be greater than zero.';
  end if;

  if p_window_ms is null or p_window_ms <= 0 then
    raise exception 'Rate-limit window must be greater than zero.';
  end if;

  v_window := make_interval(
    secs => p_window_ms::double precision / 1000.0
  );

  insert into public.rate_limit_buckets as bucket (
    key_hash,
    request_count,
    reset_at,
    updated_at
  )
  values (
    p_key_hash,
    1,
    v_now + v_window,
    v_now
  )
  on conflict (key_hash)
  do update
  set
    request_count = case
      when bucket.reset_at <= v_now then 1
      else bucket.request_count + 1
    end,
    reset_at = case
      when bucket.reset_at <= v_now then v_now + v_window
      else bucket.reset_at
    end,
    updated_at = v_now
  returning
    bucket.request_count,
    bucket.reset_at
  into
    v_current_count,
    v_reset_at;

  -- Gradually remove old buckets without requiring a scheduled cleanup job.
  delete from public.rate_limit_buckets
  where key_hash in (
    select expired_bucket.key_hash
    from public.rate_limit_buckets as expired_bucket
    where expired_bucket.reset_at < v_now - interval '1 day'
    order by expired_bucket.reset_at
    limit 50
  );

  return query
  select
    v_current_count <= p_limit,
    v_current_count,
    v_reset_at;
end;
$$;

revoke execute on function public.consume_rate_limit(
  text,
  integer,
  bigint
)
from public, anon, authenticated;

grant execute on function public.consume_rate_limit(
  text,
  integer,
  bigint
)
to service_role;

notify pgrst, 'reload schema';