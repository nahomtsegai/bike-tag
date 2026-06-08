drop function if exists public.create_pending_submission(
  text,
  text,
  text,
  text,
  text,
  text,
  text
);

notify pgrst, 'reload schema';