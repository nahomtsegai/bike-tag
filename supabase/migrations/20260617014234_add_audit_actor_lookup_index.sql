create index if not exists admin_audit_events_actor_auth_user_id_idx
on public.admin_audit_events (actor_auth_user_id);

notify pgrst, 'reload schema';
