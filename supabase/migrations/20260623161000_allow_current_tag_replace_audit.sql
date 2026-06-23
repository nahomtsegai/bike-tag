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
      'tag.current.replace',
      'game_settings.update',
      'game_data.delete'
    )
  );

notify pgrst, 'reload schema';
