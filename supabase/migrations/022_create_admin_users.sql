create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  created_at timestamptz not null default now()
);

create index if not exists admin_users_user_id_idx
on public.admin_users (user_id);

create index if not exists admin_users_email_idx
on public.admin_users (lower(email));

alter table public.admin_users enable row level security;

drop policy if exists "Service role can manage admin users"
on public.admin_users;

create policy "Service role can manage admin users"
on public.admin_users
for all
to service_role
using (true)
with check (true);

grant select, insert, update, delete
on public.admin_users
to service_role;

notify pgrst, 'reload schema';