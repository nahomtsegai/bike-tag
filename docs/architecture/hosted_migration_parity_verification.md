# Hosted Migration Parity Verification

Use this checklist after configuring the `preview` and `production` GitHub environments with the `SUPABASE_DB_URL` secret.

## Preview promotion

1. Open a pull request from `develop` to `preview`.
2. Confirm the `Verify hosted migration parity` check starts.
3. Confirm the check passes before merging.
4. Confirm the normal CI workflow also passes.

## Production promotion

1. Open a pull request from `preview` to `production`.
2. Confirm the `Verify hosted migration parity` check starts.
3. Confirm the check passes before merging.
4. Confirm the normal CI workflow also passes.

After both checks have appeared successfully, configure the protected `preview` and `production` branches to require `Verify hosted migration parity` before merging.
