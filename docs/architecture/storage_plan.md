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
4. `bike_tag_pending_photos` private bucket foundation for pending images
5. `public.create_pending_submission` function for public submit
6. `public.approve_submission` function for admin approval
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
2. Match photos
3. Pending submission photos
4. Approved submission photos

The migration file is:

```text
supabase/migrations/002_create_storage_bucket.sql
```

The bucket is configured with:

1. Public reads
2. 8 MB file limit
3. Allowed image types for jpg, png, and webp

## Private Pending Photo Storage Foundation

The private pending-photo bucket is:

```text
bike_tag_pending_photos
```

The foundation migration creates this bucket with:

1. Private reads
2. 8 MB file limit
3. Allowed image types for jpg, png, and webp
4. No anonymous storage policies

The migration also adds nullable storage-path columns to
`public.submissions`:

```text
match_photo_storage_path
next_tag_photo_storage_path
```

During the foundation phase, new submissions continue using the existing
public URL columns. The admin detail loader supports both formats:

1. Legacy public URL records return their existing URLs
2. Private path records receive temporary signed URLs
3. Signed URLs expire after 28,800 seconds, or 8 hours
4. Signed URLs are generated when an authenticated admin loads submission
   details
5. Signed URLs are never stored in the database

The upload and approval cutover to the private bucket is completed in the
next storage lifecycle phase.

Allowed MIME types:

```text
image/jpeg
image/png
image/webp
```

HEIC images are not supported yet.

Future HEIC support should convert HEIC uploads to jpg or webp before storage.

## Storage Path Format

Uploaded files should use paths under:

```text
tags/
```

Current helper generated path shape:

```text
tags/{tagId}/{photoType}_{fileId}.{extension}
```

Examples:

```text
tags/00000000-0000-0000-0000-000000000001/tag_photo_abc123.jpg
tags/00000000-0000-0000-0000-000000000001/match_photo_def456.webp
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

1. Read the storage bucket from runtime config
2. Validate the bucket value
3. Validate image MIME type
4. Validate image size
5. Create a safe storage path
6. Upload the file bytes to Supabase Storage
7. Return the public URL
8. Convert public photo URLs back to storage paths when cleanup is needed
9. Delete uploaded photos when cleanup is needed

The upload helper returns:

```text
storageBucket
storagePath
publicUrl
```

The storage helper can also delete uploaded photos by storage path.

## Submit Upload Flow

When `NUXT_TAG_DATA_SOURCE=supabase`, submit follows this flow:

1. Browser sends multipart form data
2. Server parses submit form data
3. Server validates text fields
4. Server validates image files
5. Server uploads the matching photo
6. Server uploads the next tag photo
7. Server calls `public.create_pending_submission`
8. Server returns a pending submission response
9. Browser redirects to the submit confirmation page

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

The `submissions` table has these photo columns:

```text
match_photo_url
next_tag_photo_url
```

`match_photo_url` stores the public URL for the submitted proof photo.

`next_tag_photo_url` stores the public URL for the proposed next tag photo.

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

For the first production version:

1. Photos can be publicly readable
2. Uploads should go through Nuxt server routes
3. Browser code should not use privileged credentials
4. The service role key should remain server only
5. Public URLs can be stored in the `tags` table
6. Pending submission photo URLs can be stored in the `submissions` table
7. Rejected submission photos should be deleted when possible

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

Rejected photo cleanup uses the stored public photo URLs to derive Supabase Storage paths, then deletes those paths from the configured storage bucket.

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
3. Pending submission photos referenced by `public.submissions.match_photo_url`
4. Pending submission photos referenced by `public.submissions.next_tag_photo_url`
5. Approved submission photos referenced by `public.submissions.match_photo_url`
6. Approved submission photos referenced by `public.submissions.next_tag_photo_url`
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

1. Scan the configured storage bucket
2. Build a list of referenced storage paths from database rows
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

1. Scan the configured storage bucket
2. Build a list of referenced storage paths from `public.tags`
3. Build a list of referenced storage paths from `public.submissions`
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
2. Storage bucket
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

1. Photos are not resized
2. Photos are not compressed
3. HEIC is not supported
4. New pending uploads still use the public bucket until the lifecycle cutover
5. The private pending bucket foundation is not yet used by submit or approval
6. Scheduled cleanup for old unreferenced files is planned but not implemented
7. There is no user ownership yet

## Future Improvements

Future storage improvements should include:

1. Image resizing
2. Image compression
3. HEIC conversion to jpg or webp
4. More robust cleanup logging for failed submit and rejected submission cleanup
5. Switch pending uploads and approval promotion to the private bucket
6. Separate folders for games if multiple games are supported
7. Separate folders for environments if needed
8. Scheduled cleanup dry run for old unreferenced files
9. Scheduled cleanup deletion mode after dry run verification

## Done Criteria

Storage setup is considered ready when:

1. Storage bucket exists
2. Bucket name matches runtime config
3. Upload helper validates file type
4. Upload helper validates file size
5. Submit route uploads both photos in Supabase mode
6. Public photo URLs are stored in `public.tags`
7. Pending submission photo URLs are stored in `public.submissions`
8. Current tag page shows uploaded tag photo
9. Found tags can show uploaded photo data
10. No secret values are exposed to browser code
11. Supabase submit smoke test passes
12. Failed database submit attempts clean up uploaded photos when possible
13. Rejected submissions delete uploaded photos when possible
14. Rejected submission metadata remains available after photo cleanup
15. Scheduled storage cleanup policy is documented