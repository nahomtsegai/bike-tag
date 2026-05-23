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
3. `bike_tag_photos` bucket for uploaded images
4. `public.create_pending_submission` function for public submit
5. `public.approve_submission` function for admin approval
6. `public.reject_submission` function for admin rejection

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
```

Example local `.env` shape:

```text
NUXT_TAG_DATA_SOURCE=mock
NUXT_SUPABASE_URL=
NUXT_PUBLIC_SUPABASE_ANON_KEY=
NUXT_SUPABASE_SERVICE_ROLE_KEY=
NUXT_SUPABASE_STORAGE_BUCKET=bike_tag_photos
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

## Current Limitations

Current limitations:

1. Photos are not resized
2. Photos are not compressed
3. HEIC is not supported
4. Storage bucket is public
5. There is no scheduled cleanup for old unreferenced files
6. There is no user ownership yet

## Future Improvements

Future storage improvements should include:

1. Image resizing
2. Image compression
3. HEIC conversion to jpg or webp
4. More robust cleanup logging for failed submit and rejected submission cleanup
5. Optional private bucket with signed URLs
6. Separate folders for games if multiple games are supported
7. Separate folders for environments if needed
8. Scheduled cleanup for old unreferenced files

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