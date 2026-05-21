# Bike Tag Storage Plan

## Purpose

This document describes how Bike Tag stores photos and tag data as the app moves from mock server data to Supabase.

The app now supports mock mode and Supabase mode through `NUXT_TAG_DATA_SOURCE`.

## Current Storage State

Bike Tag currently has two storage paths:

1. Mock server store

   Used when `NUXT_TAG_DATA_SOURCE=mock`.

2. Supabase database and Supabase Storage

   Used when `NUXT_TAG_DATA_SOURCE=supabase`.

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
2. `bike_tag_photos` bucket for uploaded images
3. `public.submit_bike_tag` function for submit handoff

Supabase mode behavior:

1. Read APIs load from Supabase
2. Submit uploads photos to Supabase Storage
3. Submit calls the `public.submit_bike_tag` database function
4. Previous active tag becomes found
5. New active tag becomes active

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

The helper returns:

```text
storageBucket
storagePath
publicUrl
```

## Submit Upload Flow

When `NUXT_TAG_DATA_SOURCE=supabase`, submit follows this flow:

1. Browser sends multipart form data
2. Server parses submit form data
3. Server validates text fields
4. Server validates image files
5. Server uploads the matching photo
6. Server uploads the next tag photo
7. Server calls `public.submit_bike_tag`
8. Server returns the new current tag response

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

## Storage Cleanup Concern

Current behavior uploads photos before calling the database submit function.

If photo upload succeeds but the database submit function fails, uploaded files may remain in Storage without being referenced by the database.

Future improvement:

1. Track uploaded storage paths during submit
2. If the database call fails, delete uploaded files
3. Log cleanup failures without exposing secrets
4. Add tests for partial failure behavior

## Current Limitations

Current limitations:

1. Photos are not resized
2. Photos are not compressed
3. HEIC is not supported
4. Storage bucket is public
5. Uploaded files are not cleaned up after failed database submit
6. There is no admin moderation yet
7. There is no user ownership yet

## Future Improvements

Future storage improvements should include:

1. Image resizing
2. Image compression
3. HEIC conversion to jpg or webp
4. Upload cleanup after failed submit
5. Optional private bucket with signed URLs
6. Separate folders for games if multiple games are supported
7. Separate folders for environments if needed
8. Admin moderation for uploaded photos

## Done Criteria

Storage setup is considered ready when:

1. Storage bucket exists
2. Bucket name matches runtime config
3. Upload helper validates file type
4. Upload helper validates file size
5. Submit route uploads both photos in Supabase mode
6. Public photo URLs are stored in `public.tags`
7. Current tag page shows uploaded tag photo
8. Found tags can show uploaded photo data
9. No secret values are exposed to browser code
10. Supabase submit smoke test passes