do $$
begin
  if to_regprocedure('public.approve_submission(uuid, text)') is not null then
    execute 'alter function public.approve_submission(uuid, text) set search_path = public, pg_temp';
    execute 'revoke execute on function public.approve_submission(uuid, text) from public, anon, authenticated';
    execute 'grant execute on function public.approve_submission(uuid, text) to service_role';
  end if;

  if to_regprocedure('public.create_pending_submission(text, text, text, text, text, text, text)') is not null then
    execute 'alter function public.create_pending_submission(text, text, text, text, text, text, text) set search_path = public, pg_temp';
    execute 'revoke execute on function public.create_pending_submission(text, text, text, text, text, text, text) from public, anon, authenticated';
    execute 'grant execute on function public.create_pending_submission(text, text, text, text, text, text, text) to service_role';
  end if;

  if to_regprocedure('public.create_pending_submission(text, text, text, text, text, text, text, numeric, numeric, numeric, timestamp with time zone, numeric, numeric, numeric, timestamp with time zone)') is not null then
    execute 'alter function public.create_pending_submission(text, text, text, text, text, text, text, numeric, numeric, numeric, timestamp with time zone, numeric, numeric, numeric, timestamp with time zone) set search_path = public, pg_temp';
    execute 'revoke execute on function public.create_pending_submission(text, text, text, text, text, text, text, numeric, numeric, numeric, timestamp with time zone, numeric, numeric, numeric, timestamp with time zone) from public, anon, authenticated';
    execute 'grant execute on function public.create_pending_submission(text, text, text, text, text, text, text, numeric, numeric, numeric, timestamp with time zone, numeric, numeric, numeric, timestamp with time zone) to service_role';
  end if;

  if to_regprocedure('public.reject_submission(uuid, text, text)') is not null then
    execute 'alter function public.reject_submission(uuid, text, text) set search_path = public, pg_temp';
    execute 'revoke execute on function public.reject_submission(uuid, text, text) from public, anon, authenticated';
    execute 'grant execute on function public.reject_submission(uuid, text, text) to service_role';
  end if;

  if to_regprocedure('public.set_updated_at()') is not null then
    execute 'alter function public.set_updated_at() set search_path = public, pg_temp';
    execute 'revoke execute on function public.set_updated_at() from public, anon, authenticated';
    execute 'grant execute on function public.set_updated_at() to service_role';
  end if;

  if to_regprocedure('public.submit_bike_tag(text, text, text, text, text, text, text)') is not null then
    execute 'alter function public.submit_bike_tag(text, text, text, text, text, text, text) set search_path = public, pg_temp';
    execute 'revoke execute on function public.submit_bike_tag(text, text, text, text, text, text, text) from public, anon, authenticated';
    execute 'grant execute on function public.submit_bike_tag(text, text, text, text, text, text, text) to service_role';
  end if;

  if to_regprocedure('public.update_updated_at_column()') is not null then
    execute 'alter function public.update_updated_at_column() set search_path = public, pg_temp';
    execute 'revoke execute on function public.update_updated_at_column() from public, anon, authenticated';
    execute 'grant execute on function public.update_updated_at_column() to service_role';
  end if;
end $$;

notify pgrst, 'reload schema';