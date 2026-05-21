# Bike Tag Supabase Setup Checklist

## Purpose

This checklist describes the practical setup steps for moving Bike Tag from browser local storage and the mock server store to Supabase.

The schema plan explains what the backend should look like. This checklist explains the order of setup work and tracks what has already been completed.

## Setup Goals

The first Supabase setup should support:

1. Shared tag data
2. One active tag at a time
3. Found tag history
4. Uploaded tag photos
5. Uploaded match photos
6. Hidden clues
7. Hidden map locations
8. Public found map locations
9. Future authentication
10. Future moderation

## Supabase Project

Create a new Supabase project for Bike Tag.

Recommended project name:

```text
bike_tag
```

Recommended environments:

1. Local development
2. Production later

For the first setup, one development project is enough.

## Environment Variables

The app should not hardcode Supabase values.

The project should use these environment variables:

```text
NUXT_TAG_DATA_SOURCE
NUXT_SUPABASE_URL
NUXT_PUBLIC_SUPABASE_ANON_KEY
NUXT_SUPABASE_SERVICE_ROLE_KEY
NUXT_SUPABASE_STORAGE_BUCKET
```

## Local Environment File

Future local file:

```text
.env
```

Example shape:

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

It should never be exposed to the browser.

## Completed Supabase Setup Work

The project now has the first Supabase foundation pieces in place.

Completed items:

1. Supabase client package has been added
2. Environment variable placeholders have been added
3. Server only Supabase client helper has been added
4. Tags table migration has been added
5. Storage bucket migration has been added
6. Shared validation utilities have been added
7. Read APIs exist and can use mock data or Supabase based on `NUXT_TAG_DATA_SOURCE`
8. Submit API can use mock mode or Supabase mode based on `NUXT_TAG_DATA_SOURCE`
9. Supabase submit with photo uploads has been verified locally

## Existing Migration Files

The project now includes these Supabase migration files.

1. `supabase/migrations/001_create_tags_table.sql`

   Creates the `tags` table, constraints, indexes, updated timestamp trigger, and seed data.

2. `supabase/migrations/002_create_storage_bucket.sql`

   Creates the `bike_tag_photos` storage bucket with public reads, an 8 MB file limit, and allowed image types for jpg, png, and webp.

3. `supabase/migrations/003_create_submit_tag_function.sql`

   Creates the `public.submit_bike_tag` database function used by Supabase submit mode. The function marks the current active tag as found, creates the next active tag, and returns both tag ids.

## Database Setup

The first database table is:

```text
tags
```

The table stores:

1. Tag title
2. Hidden clue
3. Tag photo URL
4. Match photo URL
5. Public found map URL
6. Hidden map URL
7. Rider display name
8. Tag status
9. Created timestamp
10. Found timestamp

## Required Database Rules

The database should enforce:

1. Valid tag status values
2. Only one active tag at a time
3. Useful indexes for active and found tags
4. Updated timestamp handling
5. Reasonable length limits for title, clue, and rider name

## Service Role Permissions

The Nuxt server uses the Supabase service role key for server side database reads and writes.

After creating the `tags` table, make sure the service role can access it.

Run this in the Supabase SQL Editor:

```sql
grant usage on schema public to service_role;

grant select, insert, update, delete
on public.tags
to service_role;
```

This allows the server API routes to read and write tag data.

The submit function also needs execute permission for the service role.

Run this in the Supabase SQL Editor:

```sql
grant execute on function public.submit_bike_tag(
  text,
  text,
  text,
  text,
  text,
  text,
  text
) to service_role;
```

After creating or replacing the submit function, reload the Supabase schema cache:

```sql
notify pgrst, 'reload schema';
```

The service role key must stay server only and should never be exposed to browser code.

## Storage Setup

The first Supabase Storage bucket is:

```text
bike_tag_photos
```

This bucket can store both:

1. Active tag photos
2. Match photos

Suggested file organization:

```text
tags/{tagId}/tag_photo.jpg
tags/{tagId}/match_photo.jpg
```

## Storage Access Plan

For the first production version:

1. Photos can be publicly readable
2. Uploads should go through Nuxt server routes
3. The browser should not upload directly with privileged credentials
4. The service role key should remain server only

## Seed Data

The database migration seeds:

1. One active tag
2. Two found tags

The seed data should match the current mock tags as closely as possible so the app behavior feels familiar when we switch reads from the mock server store to Supabase.

## Current API State

The app currently has these API routes:

```text
GET /api/tags/current
GET /api/tags
GET /api/tags/:id
POST /api/tags/submit
POST /api/tags/reset
GET /api/system/data-source
```

Current behavior:

1. Read APIs use the mock server tag store or Supabase based on `NUXT_TAG_DATA_SOURCE`
2. Submit API uses the mock server tag store or Supabase based on `NUXT_TAG_DATA_SOURCE`
3. Reset API restores the mock server tag store to sample data
4. Supabase reset behavior is not enabled yet
5. Data source status API reports current mode and safe Supabase config status

## Current Tag API

The current tag API should return:

1. id
2. title
3. tag photo URL
4. rider display name
5. status
6. created timestamp
7. clue unlock timestamp
8. clue only when unlocked

It must not return:

1. hidden map URL

## Found Tags API

The found tags API should return:

1. id
2. title
3. clue
4. tag photo URL
5. match photo URL
6. public found map URL
7. rider display name
8. status
9. created timestamp
10. found timestamp

It must not return:

1. hidden map URL

## Submit API

The submit API should:

1. Validate rider name
2. Validate map links
3. Validate image files
4. Upload match photo
5. Upload next tag photo
6. Mark the current tag as found
7. Create the next active tag
8. Store hidden clue
9. Store hidden map URL privately
10. Return the new active tag summary

## Visibility Rules

Public users can see:

1. Active tag photo
2. Active tag title
3. Active tag timer
4. Clue only after unlock
5. Found tag history
6. Public found map links

Public users must not see:

1. Hidden active map URL
2. Service role key
3. Any private admin data

## Validation Rules

### Rider name

1. Required
2. Trim whitespace
3. Suggested max length is 50 characters

### Title

1. Required
2. Suggested max length is 80 characters

### Clue

1. Required
2. Suggested max length is 500 characters

### Map links

Allowed hosts:

```text
www.google.com
maps.google.com
maps.app.goo.gl
```

Required protocol:

```text
https
```

### Images

Allowed types:

```text
image/jpeg
image/png
image/webp
```

Suggested max size:

```text
8 MB
```

HEIC images are not supported yet. Future support should convert HEIC uploads to jpg or webp before storage.

## Security Checklist

Before implementation is considered ready:

1. Service role key is server only
2. Public APIs do not expose hidden map URLs
3. Public APIs do not expose locked clues
4. Submit route validates all inputs
5. Image upload route validates file type
6. Image upload route validates file size
7. Database prevents multiple active tags
8. Environment variables are documented
9. Supabase reads do not expose private columns
10. Supabase writes happen through server routes
11. Service role table permissions are configured
12. Submit function execute permission is configured
13. Supabase schema cache is reloaded after function changes

## Completed Implementation Slices

These implementation slices are complete:

1. Add Supabase environment variable documentation
2. Install Supabase client package
3. Add server only Supabase client helper
4. Add database migration
5. Add storage bucket migration
6. Add mock server store
7. Add read APIs
8. Add submit API validation
9. Wire submit flow to the API
10. Add shared validation utilities
11. Add data source switch
12. Verify Supabase read mode locally
13. Add Supabase submit database function
14. Add Supabase submit helper
15. Enable Supabase submit with photo uploads

## Next Implementation Slice

The next recommended code slice should be:

1. Improve Supabase submit user feedback
2. Document Supabase submit mode in Settings
3. Add clearer Settings status for whether Supabase submit is available
4. Keep `NUXT_TAG_DATA_SOURCE=mock` as the default for normal local development

## Future Implementation Slice

Future backend improvements should include:

1. Development only Supabase reset support
2. Admin moderation workflow
3. Optional approval before a new tag becomes active
4. User identity through Supabase Auth
5. Multiple Bike Tag games

## Storage Implementation Slice

Storage support now exists for Supabase submit mode.

Future storage improvements should include:

1. Better upload cleanup if the database submit function fails
2. Image resizing or compression
3. HEIC conversion to jpg or webp
4. Separate folders for match photos and tag photos if needed
5. Optional private buckets with signed URLs

## Open Questions

1. Should the first Supabase version allow anonymous public submissions?
2. Should admin approval be required before a new tag becomes active?
3. Should hidden map URLs be visible to admins only?
4. Should the app support more than one Bike Tag game later?
5. Should match photos and tag photos use separate storage folders?
6. Should Supabase Auth be added before public launch?
7. Should the reset API be disabled outside development?
8. Should Supabase reads be enabled by an environment variable?
9. Should Supabase submit be enabled by a separate environment variable?
10. Should uploaded photos be cleaned up if database submit fails?

## Done Criteria

This setup phase is ready when:

1. Supabase project exists
2. Environment variable names are agreed on
3. Database schema is approved
4. Storage bucket name is approved
5. Seed data plan is approved
6. API visibility rules are approved
7. Supabase read strategy is approved
8. Supabase write strategy is approved
9. Service role permissions are configured
10. Supabase submit function is configured
11. Supabase submit smoke test passes