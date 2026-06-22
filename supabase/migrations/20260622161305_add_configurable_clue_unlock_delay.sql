create table if not exists public.game_settings (
  id boolean primary key default true,
  clue_unlock_delay_days smallint not null default 5,
  updated_at timestamptz not null default now(),

  constraint game_settings_singleton
    check (id),

  constraint game_settings_clue_unlock_delay_days_range
    check (clue_unlock_delay_days between 0 and 30)
);

insert into public.game_settings (
  id,
  clue_unlock_delay_days
)
values (
  true,
  5
)
on conflict (id) do nothing;

alter table public.game_settings enable row level security;

revoke all
on table public.game_settings
from public, anon, authenticated, service_role;

grant select, update
on table public.game_settings
to service_role;

alter table public.tags
  add column if not exists clue_unlocks_at timestamptz;

update public.tags
set clue_unlocks_at =
  created_at + make_interval(
    days => (
      select clue_unlock_delay_days::integer
      from public.game_settings
      where id = true
    )
  )
where clue_unlocks_at is null;

create or replace function public.set_tag_clue_unlocks_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_clue_unlock_delay_days integer;
begin
  if new.clue_unlocks_at is not null then
    return new;
  end if;

  select clue_unlock_delay_days::integer
  into v_clue_unlock_delay_days
  from public.game_settings
  where id = true;

  new.clue_unlocks_at :=
    coalesce(new.created_at, now()) +
    make_interval(days => coalesce(v_clue_unlock_delay_days, 5));

  return new;
end;
$$;

drop trigger if exists set_tag_clue_unlocks_at_before_insert
on public.tags;

create trigger set_tag_clue_unlocks_at_before_insert
before insert on public.tags
for each row
execute function public.set_tag_clue_unlocks_at();

alter table public.tags
  alter column clue_unlocks_at set not null;

revoke execute on function public.set_tag_clue_unlocks_at()
from public, anon, authenticated;

grant execute on function public.set_tag_clue_unlocks_at()
to service_role;

alter table public.admin_audit_events
  drop constraint if exists admin_audit_events_action_allowed;

alter table public.admin_audit_events
  add constraint admin_audit_events_action_allowed
  check (
    action in (
      'admin.login',
      'submission.approve',
      'submission.reject',
      'submission.archive',
      'submission.delete',
      'notification.retry',
      'tag.opening.create',
      'game_settings.update',
      'game_data.delete'
    )
  );

comment on table public.game_settings is
  'Singleton configuration used when new Bike Tags become active.';

comment on column public.tags.clue_unlocks_at is
  'Immutable clue reveal timestamp captured when a tag becomes active.';

notify pgrst, 'reload schema';
