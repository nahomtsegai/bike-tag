# Storage Cleanup Dry Run

Bike Tag scans both Supabase Storage photo buckets for files that are no longer referenced by game data. This implementation is observation-only and never removes files.

## Scope

The scanner checks the published-photo bucket and the private pending-photo bucket. It traverses folders recursively and reads entries in batches of 100.

Before selecting candidates, it loads photo references from the `tags` and `submissions` tables, including both public photo URLs and private pending storage paths. Referenced objects are always preserved.

## Grace period

The default grace period is seven days and is configurable through `NUXT_STORAGE_CLEANUP_GRACE_PERIOD_DAYS`.

Recent unreferenced files are skipped. Files without a trustworthy timestamp are also skipped.

## Entry points

Authenticated admins can run the scan with:

```text
POST /api/admin/storage-cleanup/dry-run
```

A daily Vercel Cron invokes:

```text
GET /api/internal/storage-cleanup
```

The scheduled route requires the Vercel cron authentication environment variable to be configured.

## Failure behavior

The scan stops when a required database query or bucket listing fails. A partial result is never reported as complete. No code in this PR calls a Storage removal API.

## Output

The result and structured server log include the cutoff, scan counts, referenced counts, skipped counts, candidate count, candidate size, and each candidate's bucket, path, timestamp, age, and size.

Deletion mode is intentionally excluded and should be added only after dry-run results have been reviewed in Preview and Production.
