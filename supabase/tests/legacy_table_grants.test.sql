begin;

create extension if not exists pgtap with schema extensions;

select plan(3);

select is(
  (
    select count(*)::integer
    from (
      values
        ('anon'::text),
        ('authenticated'::text)
    ) as roles(role_name)
    cross join (
      values
        ('public.tags'::text),
        ('public.submissions'::text),
        ('public.submit_diagnostic_events'::text),
        ('public.admin_users'::text)
    ) as tables(table_name)
    cross join unnest(
      array[
        'SELECT',
        'INSERT',
        'UPDATE',
        'DELETE',
        'TRUNCATE',
        'REFERENCES',
        'TRIGGER'
      ]::text[]
    ) as privileges(privilege_name)
    where has_table_privilege(
      roles.role_name,
      tables.table_name,
      privileges.privilege_name
    )
  ),
  0,
  'anon and authenticated have no privileges on server-managed tables'
);

select is(
  (
    select count(*)::integer
    from (
      values
        ('public.tags'::text),
        ('public.submissions'::text),
        ('public.submit_diagnostic_events'::text),
        ('public.admin_users'::text)
    ) as tables(table_name)
    cross join unnest(
      array['SELECT', 'INSERT', 'UPDATE', 'DELETE']::text[]
    ) as privileges(privilege_name)
    where has_table_privilege(
      'service_role',
      tables.table_name,
      privileges.privilege_name
    )
  ),
  16,
  'service_role retains CRUD access to server-managed tables'
);

select has_index(
  'public',
  'submission_notification_attempts',
  'submission_notification_attempts_retry_of_id_idx',
  'notification retry lookups include a covering index'
);

select * from finish();

rollback;
