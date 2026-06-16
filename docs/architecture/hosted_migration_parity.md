# Hosted Supabase Migration Parity

## Purpose

Bike Tag blocks environment promotions when the checked-in Supabase migration
files do not match the target hosted database migration ledger.

This protects against:

1. Missing hosted migrations
2. Migrations applied manually but not checked into the repository
3. Duplicate or unexpected hosted migration versions
4. Migration files renamed after they were applied
5. Preview and Production silently drifting away from the repository

## When the Check Runs

The existing GitHub Actions `Verify app` job runs the parity check only for
trusted promotion pull requests:

```text
develop -> preview
preview -> production
```

Feature pull requests targeting `develop` do not receive hosted database
credentials and do not query a hosted Supabase project.

The check is read-only. The PostgreSQL session sets
`default_transaction_read_only=on` before reading:

```text
supabase_migrations.schema_migrations
```

It never applies, repairs, or deletes migrations.

## Required GitHub Secrets

Add these repository Actions secrets:

```text
SUPABASE_PREVIEW_DB_URL
SUPABASE_PRODUCTION_DB_URL
```

Each value must be a PostgreSQL connection URI for the corresponding Supabase
project. Keep these values in GitHub Actions secrets only. Do not add them to
tracked environment files, workflow YAML, pull-request text, or logs.

The workflow exposes only the secret required by the current promotion target:

1. `develop -> preview` uses `SUPABASE_PREVIEW_DB_URL`
2. `preview -> production` uses `SUPABASE_PRODUCTION_DB_URL`

## Local Use

Run the same read-only check manually with:

```bash
SUPABASE_DB_URL='postgresql://...' \
SUPABASE_ENVIRONMENT='Preview' \
npm run check:migrations:hosted
```

The command compares every file matching:

```text
supabase/migrations/<version>_<name>.sql
```

against the hosted migration ledger.

## Failure Behavior

The check fails and reports separate sections for:

1. Repository migrations missing from the hosted database
2. Hosted migration records missing from the repository
3. Matching versions whose migration names differ

Resolve the actual schema and migration-history discrepancy before merging the
promotion pull request. Do not bypass the check by deleting a migration file or
editing the hosted ledger without first confirming the deployed schema state.
