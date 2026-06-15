# Migration-backed database CI

The required `Verify app` workflow runs a local Supabase database check through
`npm run verify` when the `CI` environment variable is present.

The database check:

1. Initializes an ephemeral local Supabase project.
2. Starts a fresh local database and applies every migration in
   `supabase/migrations`.
3. Runs pgTAP tests from `supabase/tests`.
4. Stops and removes the local Supabase stack.

The idempotent submission RPC test creates an active tag, calls
`create_idempotent_private_pending_submission` twice with the same client
submission id, and verifies that the retry returns the original submission
without creating a duplicate.

Run the complete CI-equivalent verification with:

```bash
CI=1 npm run verify
```

Docker must be running because the Supabase CLI uses containers for its local
database.
