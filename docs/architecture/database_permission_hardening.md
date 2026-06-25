# Database Permission Hardening

Bike Tag server-managed tables use row-level security and are accessed through the server-side Supabase service role.

The `anon` and `authenticated` roles must not retain direct table privileges on:

- `public.tags`
- `public.submissions`
- `public.submit_diagnostic_events`
- `public.admin_users`

The service role retains the CRUD privileges required by the Nuxt server.

`public.submission_notification_attempts.retry_of_id` also has a covering index so notification retry-chain lookups and foreign-key maintenance do not require full-table scans as history grows.
