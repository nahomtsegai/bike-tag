begin;

create extension if not exists pgtap with schema extensions;

select plan(2);

select has_index(
  'public',
  'admin_audit_events',
  'admin_audit_events_actor_created_at_idx',
  'admin audit events include the admin-user lookup index'
);

select has_index(
  'public',
  'admin_audit_events',
  'admin_audit_events_actor_auth_user_id_idx',
  'admin audit events include the auth-user lookup index'
);

select * from finish();

rollback;
