grant usage on schema public to service_role;

grant select, insert, update, delete
on public.tags
to service_role;

notify pgrst, 'reload schema';
