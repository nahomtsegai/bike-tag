alter table public.tags enable row level security;
alter table public.submissions enable row level security;

drop policy if exists "Service role can manage tags"
on public.tags;

create policy "Service role can manage tags"
on public.tags
for all
to service_role
using (true)
with check (true);

drop policy if exists "Service role can manage submissions"
on public.submissions;

create policy "Service role can manage submissions"
on public.submissions
for all
to service_role
using (true)
with check (true);

notify pgrst, 'reload schema';