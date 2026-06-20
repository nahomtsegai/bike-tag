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

## Trend history

Both entry points record one aggregate row in `public.storage_cleanup_runs`. Successful rows include scan totals, referenced-file totals, skipped-file totals, candidate count, estimated candidate bytes, environment, and timestamps. Failed rows include the environment, timestamps, and a truncated error summary.

The authenticated admin page at `/admin/storage-cleanup` shows the latest successful totals, change from the previous successful scan, recent failures, and the latest 30 runs for the current environment.

Object paths, signed URLs, and candidate details are not stored in trend history.

## Failure behavior

The scan stops when a required database query or bucket listing fails. A partial result is never reported as complete. Failure history is recorded before the original error is rethrown. A history-write failure is logged but does not replace the scan result or error.

## Output

The direct scan response and structured server log still include candidate details for immediate operational review. The durable trend table stores aggregate values only.

Deletion mode is intentionally excluded and should be added only after dry-run results have been reviewed in Preview and Production.
