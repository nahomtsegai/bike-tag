create table if not exists public.submit_diagnostic_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  event_name text not null,
  step text,
  message text,
  metadata jsonb not null default '{}'::jsonb,
  user_agent text,
  screen_width integer,
  screen_height integer,
  created_at timestamptz not null default now()
);

create index if not exists submit_diagnostic_events_session_id_idx
on public.submit_diagnostic_events (session_id);

create index if not exists submit_diagnostic_events_event_name_idx
on public.submit_diagnostic_events (event_name);

create index if not exists submit_diagnostic_events_created_at_idx
on public.submit_diagnostic_events (created_at desc);

alter table public.submit_diagnostic_events enable row level security;

drop policy if exists "Service role can manage submit diagnostic events"
on public.submit_diagnostic_events;

create policy "Service role can manage submit diagnostic events"
on public.submit_diagnostic_events
for all
to service_role
using (true)
with check (true);

grant usage on schema public to service_role;

grant insert, select, update, delete
on public.submit_diagnostic_events
to service_role;

notify pgrst, 'reload schema';