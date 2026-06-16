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

The dedicated GitHub Actions `Hosted migration parity` workflow runs only for
trusted promotion pull requests:

```text
develop -> preview
preview -> production
```

Feature pull requests targeting `develop` do not receive hosted database
credentials and do not query a hosted Supabase project.

The workflow uses `pull_request_target` so the workflow and checker are loaded
from the protected target branch. Candidate migration files are copied into the
trusted checkout as inert SQL files. No script, package, workflow, or executable
from the pull-request branch runs with the database credential.

The check is read-only. The PostgreSQL session sets
`default_transaction_read_only=on` before reading:

```text
supabase_migrations.schema_migrations
```

It never applies, repairs, or deletes migrations.

## Required GitHub Environments

Create these GitHub Actions environments:

```text
preview
production
```

Add the same environment secret name to each environment:

```text
SUPABASE_DB_URL
```

The `preview` value must be a PostgreSQL connection URI for the Preview
Supabase project. The `production` value must connect to the Production
Supabase project.

Keep these values in environment secrets only. Do not add them to tracked
environment files, workflow YAML, pull-request text, or logs. A required
reviewer can be added to the `production` environment for an additional manual
approval before the credential is released.

## Initial Rollout

A `pull_request_target` workflow must already exist on the target branch before
GitHub can run it. Roll out this feature in this order:

1. Merge the feature into `develop`.
2. Create the `preview` and `production` GitHub environments and their
   `SUPABASE_DB_URL` secrets.
3. Promote the feature once from `develop` to `preview` and then from `preview`
   to `production`.
4. Add `Verify hosted migration parity` as a required status check for the
   protected `preview` and `production` branches.

After that bootstrap promotion, every later promotion is checked before merge.

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
