# Development Supabase Migration Parity Repair

## Purpose

This note documents the June 2026 repair that aligned the Development Supabase migration ledger with the repository, Preview, and Production.

## Drift that was repaired

Development had two audit-history discrepancies:

1. `create_admin_audit_events` was recorded as version `20260616224000` instead of the repository version `20260617010712`.
2. `20260617014234_add_audit_actor_lookup_index.sql` had not been applied, so `admin_audit_events_actor_auth_user_id_idx` was missing.

The audit table and its existing indexes were verified before changing the hosted migration ledger.

## Safe repair order

1. Confirm the canonical migration version is not already present.
2. Confirm the old hosted row has the expected migration name.
3. Verify the deployed schema created by that migration exists.
4. Update only the incorrect migration version in `supabase_migrations.schema_migrations`.
5. Apply the missing checked-in migration through the normal migration runner.
6. Normalize the generated hosted version to the repository filename version when necessary.
7. Verify the expected index exists.
8. Compare the full hosted migration ledger with `supabase/migrations`.

Do not rename a hosted migration record merely to silence parity checks. Schema state must be verified first.

## Checker behavior

The hosted migration parity checker recognizes a migration with the same unique name but a different version as a version mismatch. It reports the repository and hosted versions directly instead of listing the migration separately as missing and unexpected.

## Verification

After repair, Development should contain:

```text
20260617010712_create_admin_audit_events
20260617014234_add_audit_actor_lookup_index
```

The following indexes must exist on `public.admin_audit_events`:

```text
admin_audit_events_actor_created_at_idx
admin_audit_events_actor_auth_user_id_idx
```
