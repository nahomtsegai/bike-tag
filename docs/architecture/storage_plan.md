# Bike Tag Storage Plan

## Purpose

This document describes how Bike Tag stores photos and tag data as the app moves from mock server data to Supabase.

The app now supports mock mode and Supabase mode through `NUXT_TAG_DATA_SOURCE`.

## Current Storage State

Bike Tag currently has two storage paths:

1. Mock server store
2. Supabase database and Supabase Storage

Mock server store is used when:

```text
NUXT_TAG_DATA_SOURCE=mock
```

Supabase database and Supabase Storage are used when:

```text
NUXT_TAG_DATA_SOURCE=supabase
```

## Data Source Modes

The active data source is controlled by:

```text
NUXT_TAG_DATA_SOURCE
```

Supported values:

```text
mock
supabase
```

Recommended default for normal local development:

```text
NUXT_TAG_DATA_SOURCE=mock
```

Supabase mode should be used when the Supabase project, migrations, permissions, storage bucket, and environment values are ready.

## Mock Mode Storage

Mock mode uses an in memory server tag store.

Mock mode behavior:

1. Read APIs return mock server data
2. Submit updates the mock server store
3. Reset restores the mock server store
4. Restarting the dev server resets the mock server store
5. No Supabase project is required

Mock mode is useful for:

1. UI development
2. Submit flow testing
3. Local work without real backend setup
4. Quick resets

## Supabase Mode Storage

Supabase mode uses:

1. `public.tags` table for tag data
2. `public.submissions` table for moderated submissions
3. `bike_tag_photos` public bucket for approved and legacy images
4. `bike_tag_pending_photos` private bucket for pending images
5. `public.create_private_pending_submission` function for new submissions
6. `public.approve_submission_with_public_photos` function for admin approval
7. `public.reject_submission` function for admin rejection

Supabase mode behavior:

1. Read APIs load from Supabase
2. Submit uploads photos to Supabase Storage
3. Submit creates a pending submission
4. Current active tag remains active until admin approval
5. Admin approval marks the previous active tag as found
6. Admin approval creates the next active tag
7. Admin rejection leaves the current active tag unchanged
8. Admin rejection deletes rejected submission photos when possible

## Supabase Environment Variables

The app should use these environment variables:

```text
NUXT_TAG_DATA_SOURCE
NUXT_SUPABASE_URL
NUXT_PUBLIC_SUPABASE_ANON_KEY
NUXT_SUPABASE_SERVICE_ROLE_KEY
NUXT_SUPABASE_STORAGE_BUCKET
NUXT_SUPABASE_PENDING_STORAGE_BUCKET
NUXT_ADMIN_PHOTO_SIGNED_URL_TTL_SECONDS
```

Example local `.env` shape:

```text
NUXT_TAG_DATA_SOURCE=mock
NUXT_SUPABASE_URL=
NUXT_PUBLIC_SUPABASE_ANON_KEY=
NUXT_SUPABASE_SERVICE_ROLE_KEY=
NUXT_SUPABASE_STORAGE_BUCKET=bike_tag_photos
NUXT_SUPABASE_PENDING_STORAGE_BUCKET=bike_tag_pending_photos
NUXT_ADMIN_PHOTO_SIGNED_URL_TTL_SECONDS=28800
```

Important:

```text
NUXT_SUPABASE_SERVICE_ROLE_KEY must only be used on the server.
```

Do not expose the service role key to browser code.

Do not commit `.env`.

## Supabase Storage Bucket

The first storage bucket is:

```text
bike_tag_photos
```

This bucket stores:

1. Active tag photos
2. Match photos for found tags
3. Approved submission photos
4. Legacy pending photos created before the private-storage cutover

The migration file is:

```text
supabase/migrations/002_create_storage_bucket.sql
```

The bucket is configured with:

1. Public reads
2. 8 MB file limit
3. Allowed image types for jpg, png, and webp

## Private Pending Photo Storage

The private pending-photo bucket is:

```text
bike_tag_pending_photos
```

The bucket is configured with:

1. Private reads
2. 8 MB per-file limit
3. Allowed image types for jpg, png, and webp
4. No anonymous storage policies

New submissions store object paths in these nullable columns:

```text
match_photo_storage_path
next_tag_photo_storage_path
```

Pending photo behavior:

1. The submit API uploads both files to the private bucket
2. The database stores private object paths, not signed URLs
3. An authenticated admin detail request creates temporary signed URLs
4. Signed URLs expire after 28,800 seconds, or 8 hours
5. Reloading or reopening a submission creates fresh signed URLs
6. Signed URLs are never stored in the database
7. The admin submission list does not create signed URLs

Approval behavior:

1. Copy each private object to a new unique path in `bike_tag_photos`
2. Generate permanent public URLs for the copied objects
3. Complete the tag and submission updates in one database function
4. If the database transaction fails, delete the new public copies
5. If approval succeeds, delete the private originals when possible
6. Preserve support for legacy pending submissions that already contain public URLs

Rejection behavior:

1. Update the submission status first
2. Delete private pending objects when possible
3. Delete legacy public pending objects when applicable
4. Keep review metadata even after the photos are removed
5. Do not generate photo URLs when an admin reopens a rejected submission

Allowed MIME types:

```text
image/jpeg
image/png
image/webp
```

HEIC images are converted by the client before upload when supported by the
submission preparation flow. Stored files must still use an allowed MIME type.

## Storage Path Format

Private pending files use:

```text
submissions/{submissionGroupId}/{photoType}_{fileId}.{extension}
```

Approved public copies use:

```text
tags/{submissionId}/{photoType}_{fileId}.{extension}
```

Examples:

```text
submissions/00000000-0000-0000-0000-000000000001/tag_photo_abc123.jpg
tags/00000000-0000-0000-0000-000000000002/match_photo_def456.webp
```

The upload helper creates unique file names so repeated submits do not overwrite old photos.

## Photo Types

Supported photo types:

```text
tag_photo
match_photo
```

`tag_photo` means the photo for the new active tag.

`match_photo` means the proof photo for the tag that was found.

## Server Storage Helper

Supabase uploads are handled by:

```text
server/utils/supabaseStorage.ts
```

The helper should:

1. Read the public and private bucket names from runtime config
2. Validate bucket values
3. Validate image MIME type and size
4. Create safe unique storage paths
5. Upload new submission files to the private bucket
6. Generate signed admin URLs for private files
7. Copy approved files from the private bucket to the public bucket
8. Return permanent public URLs only after promotion
9. Delete objects from either bucket during rollback or cleanup
10. Convert legacy public URLs back to storage paths when cleanup is needed

## Submit Upload Flow

When `NUXT_TAG_DATA_SOURCE=supabase`, submit follows this flow:

1. Browser sends multipart form data
2. Server parses submit form data
3. Server validates text fields
4. Server validates image files
5. Server uploads the matching photo to the private pending bucket
6. Server uploads the next tag photo to the private pending bucket
7. Server calls `public.create_private_pending_submission`
8. The submission row stores both private object paths
9. Server returns a pending submission response
10. Browser redirects to the submit confirmation page

The submit route is:

```text
POST /api/tags/submit
```

## Database Photo Columns

The `tags` table has these photo columns:

```text
tag_photo_url
match_photo_url
```

`tag_photo_url` stores the public URL for the tag photo.

`match_photo_url` stores the public URL for the proof photo after a tag is found.

The `submissions` table has public URL and private path columns:

```text
match_photo_url
match_photo_storage_path
next_tag_photo_url
next_tag_photo_storage_path
```

While a new submission is pending, the private path columns are populated and
the URL columns are null. Approval stores permanent public URLs and clears the
private path columns. Legacy submissions may contain public URLs without
private paths.

## Visibility Rules

Public APIs may return:

1. Active tag photo URL
2. Found tag photo URL
3. Match photo URL for found tags
4. Public found map URL

Public APIs must not return:

1. Hidden active map URL
2. Service role key
3. Private backend config
4. Admin only data
5. Pending submission data
6. Rejected submission data

## Upload Validation Rules

Image uploads must pass shared validation.

Shared validation file:

```text
shared/utils/imageValidation.ts
```

Allowed MIME types:

```text
image/jpeg
image/png
image/webp
```

Maximum file size:

```text
8 MB
```

Rejected files should show clear validation messages.

## Storage Access Plan

Current access rules:

1. Approved game photos are publicly readable
2. Pending submission photos are private
3. Uploads go through Nuxt server routes
4. Browser code never receives privileged credentials
5. The service role key remains server only
6. Admins receive temporary signed URLs for pending photos
7. Rejected submission photos are deleted when possible

## Storage Cleanup Behavior

Supabase submit uploads photos before creating the pending submission.

Failed submit cleanup behavior:

1. Track uploaded storage paths during submit
2. Upload the matching photo
3. Upload the next tag photo
4. Call the pending submission database function
5. If the database call succeeds, keep the uploaded photos
6. If the database call fails, delete the uploaded photos from Supabase Storage
7. Return the original submit error to the user

Cleanup errors are logged on the server, but they do not replace the original submit error.

Rejected submission cleanup behavior:

1. Keep photos while a submission is pending
2. Keep photos when a submission is approved
3. Delete uploaded photos when a submission is rejected
4. Keep rejected submission metadata
5. Keep rejection reason, reviewer, review timestamp, and status
6. Log cleanup failures without blocking the rejection decision

Rejected photo cleanup deletes private object paths directly. Legacy public
submissions still derive storage paths from their existing public URLs.

Future cleanup improvements:

1. Add structured server logging for cleanup failures
2. Add automated coverage for partial failure behavior
3. Add a scheduled cleanup process for old unreferenced files

## Scheduled Storage Cleanup Plan

Scheduled storage cleanup is a future maintenance job that should remove old unreferenced files from Supabase Storage.

This job should be designed carefully because game photos are part of the public history and should not be deleted accidentally.

Purpose:

1. Remove old orphaned files
2. Reduce unnecessary storage growth
3. Clean up files left behind by interrupted requests or unexpected failures
4. Preserve all photos still referenced by game data
5. Preserve audit history for moderated submissions

## Scheduled Cleanup Safety Rules

Scheduled cleanup must never delete files that are still referenced by app data.

Files that must be kept:

1. Active tag photos referenced by `public.tags.tag_photo_url`
2. Found tag match photos referenced by `public.tags.match_photo_url`
3. Pending private photos referenced by `public.submissions.match_photo_storage_path`
4. Pending private photos referenced by `public.submissions.next_tag_photo_storage_path`
5. Approved public photos referenced by `public.submissions.match_photo_url`
6. Approved public photos referenced by `public.submissions.next_tag_photo_url`
7. Recently uploaded files inside the cleanup grace period

Files that may be eligible for cleanup:

1. Files in the storage bucket that are not referenced by `public.tags`
2. Files in the storage bucket that are not referenced by `public.submissions`
3. Files older than the configured grace period
4. Files left behind by interrupted or failed requests
5. Files from manual testing that are no longer referenced by database rows

## Scheduled Cleanup Grace Period

Scheduled cleanup should use a grace period before deleting unreferenced files.

Recommended initial grace period:

```text
7 days
```

Reasoning:

1. Prevent deleting files from requests that are still in progress
2. Give developers time to inspect failed upload behavior
3. Reduce risk during local and early production testing
4. Avoid accidental deletion from temporary database or network timing issues

The grace period should be configurable later through environment settings.

Potential future environment variable:

```text
NUXT_STORAGE_CLEANUP_GRACE_PERIOD_DAYS=7
```

## Scheduled Cleanup Dry Run

The first implementation should support dry run behavior.

Dry run behavior:

1. Scan both configured storage buckets
2. Build a bucket-aware list of referenced storage paths from database rows
3. Compare storage files against referenced paths
4. Identify unreferenced files older than the grace period
5. Log what would be deleted
6. Do not delete files

Dry run should happen before actual deletion is enabled.

Reasoning:

1. Confirm the matching logic is safe
2. Give developers confidence before deleting files
3. Make it easier to review cleanup decisions
4. Reduce risk of deleting valid game photos

## Scheduled Cleanup Deletion Mode

After dry run behavior is verified, deletion mode can be added.

Deletion mode behavior:

1. Scan both configured storage buckets
2. Build a list of referenced public paths from `public.tags`
3. Build public URL and private path references from `public.submissions`
4. Exclude files inside the grace period
5. Delete only unreferenced files outside the grace period
6. Log deleted paths
7. Log cleanup failures
8. Continue processing other files if one delete fails

Deletion should be best effort.

A failed cleanup job should not affect public submit, admin approval, admin rejection, or public reads.

## Scheduled Cleanup Logging

Scheduled cleanup should log enough information to debug cleanup decisions.

Logs should include:

1. Cleanup mode
2. Storage bucket or buckets
3. Grace period
4. Number of files scanned
5. Number of referenced files found
6. Number of cleanup candidates found
7. Number of files deleted
8. Paths skipped because they are referenced
9. Paths skipped because they are inside the grace period
10. Paths that failed deletion

Future structured logging should make cleanup results searchable in hosting logs.

## Scheduled Cleanup Testing Plan

Scheduled cleanup should be tested before actual deletion is enabled.

Manual test coverage should verify:

1. Referenced active tag photos are kept
2. Referenced found tag photos are kept
3. Referenced pending submission photos are kept
4. Referenced approved submission photos are kept
5. Rejected submission photos are already deleted during rejection
6. Unreferenced files inside the grace period are kept
7. Unreferenced files outside the grace period are marked as cleanup candidates
8. Dry run logs cleanup candidates without deleting files
9. Deletion mode deletes only eligible unreferenced files
10. Cleanup failures are logged without blocking app behavior

## Current Limitations

Current limitations:

1. Approval and database updates cannot share one transaction with Storage
2. Cleanup after a successful approval is best effort
3. Failed cleanup can leave an unreferenced private object for a future cleanup job
4. Scheduled cleanup for old unreferenced files is planned but not implemented
5. There is no user ownership yet

## Future Improvements

Future storage improvements should include:

1. More robust cleanup logging and alerting
2. A retry queue for failed post-approval private cleanup
3. Separate folders for games if multiple games are supported
4. Separate folders for environments if needed
5. Scheduled cleanup dry run for old unreferenced files
6. Scheduled cleanup deletion mode after dry run verification

## Done Criteria

Storage setup is considered ready when:

1. Storage buckets exist and match runtime config
2. Upload helpers validate file type and size
3. Submit uploads both photos to the private pending bucket
4. Pending submission paths are stored in `public.submissions`
5. Admin review uses temporary signed URLs
6. Approval promotes private photos into the public bucket
7. Approval stores permanent public URLs in `public.tags`
8. Failed approval rolls back newly copied public objects when possible
9. Successful approval removes private originals when possible
10. Rejection removes pending photos when possible
11. Rejected submission metadata remains available after photo cleanup
12. Current and found tag pages show approved photo data
13. No secret values are exposed to browser code
14. Supabase submit and review smoke tests pass
15. Scheduled storage cleanup policy is documented
