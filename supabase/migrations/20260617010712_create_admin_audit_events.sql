create table if not exists public.admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  outcome text not null default 'started',
  actor_admin_user_id uuid references public.admin_users(id) on delete set null,
  actor_auth_user_id uuid references auth.users(id) on delete set null,
  actor_email text,
  target_type text,
  target_id text,
  request_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,

  constraint admin_audit_events_action_allowed
    check (
      action in (
        'admin.login',
        'submission.approve',
        'submission.reject',
        'submission.archive',
        'submission.delete',
        'tag.opening.create',
        'game_data.delete'
      )
    ),

  constraint admin_audit_events_outcome_allowed
    check (outcome in ('started', 'succeeded', 'failed')),

  constraint admin_audit_events_metadata_object
    check (jsonb_typeof(metadata) = 'object'),

  constraint admin_audit_events_completion_consistent
    check (
      (outcome = 'started' and completed_at is null)
      or (outcome in ('succeeded', 'failed') and completed_at is not null)
    )
);

create index if not exists admin_audit_events_created_at_idx
on public.admin_audit_events (created_at desc);

create index if not exists admin_audit_events_actor_created_at_idx
on public.admin_audit_events (actor_admin_user_id, created_at desc);

create index if not exists admin_audit_events_target_created_at_idx
on public.admin_audit_events (target_type, target_id, created_at desc);

alter table public.admin_audit_events enable row level security;

revoke all
on table public.admin_audit_events
from public, anon, authenticated, service_role;

grant select, insert, update
on table public.admin_audit_events
to service_role;

comment on table public.admin_audit_events is
  'Append-only security audit trail for authenticated Bike Tag admin actions.';

notify pgrst, 'reload schema';
