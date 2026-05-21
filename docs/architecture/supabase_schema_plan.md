# Bike Tag Supabase Schema Plan

## Purpose

This document describes the Supabase schema for Bike Tag.

The schema supports one active tag, found tag history, hidden clues, hidden map locations, uploaded photos, and future moderation.

## Current Status

The project now includes these Supabase migrations:

```text
supabase/migrations/001_create_tags_table.sql
supabase/migrations/002_create_storage_bucket.sql
supabase/migrations/003_create_submit_tag_function.sql
```

Supabase mode has been verified locally for:

1. Reading the current tag
2. Reading found tags
3. Reading tag details
4. Uploading submit photos
5. Marking the current tag as found
6. Creating the next active tag

## Data Source Modes

The app supports two data source modes:

```text
mock
supabase
```

The mode is controlled by:

```text
NUXT_TAG_DATA_SOURCE
```

In mock mode, reads and submits use the in memory mock server store.

In Supabase mode, reads and submits use Supabase.

## Table: tags

The main table is:

```text
public.tags
```

This table stores both active and found tags.

## Columns

### id

Type:

```text
uuid
```

Purpose:

1. Primary key
2. Stable tag identifier
3. Used by tag detail routes
4. Used for future storage organization

### title

Type:

```text
text
```

Purpose:

1. Display title for the tag
2. Shown on current tag, tags history, and detail pages

Rules:

1. Required
2. Suggested max length is 80 characters

### clue

Type:

```text
text
```

Purpose:

1. Clue for finding the tag
2. Hidden until unlock time for active tags
3. Visible for found tags

Rules:

1. Required
2. Suggested max length is 500 characters

### tag_photo_url

Type:

```text
text
```

Purpose:

1. Public URL for the tag photo
2. Used by current tag and found tag views

Rules:

1. Required for Supabase submit mode
2. May be empty for early seed data

### match_photo_url

Type:

```text
text
```

Purpose:

1. Public URL for the proof photo when a tag is found
2. Stored when someone submits a found tag

Rules:

1. Null for active tags
2. Present for found tags after real submit

### location_map_url

Type:

```text
text
```

Purpose:

1. Public found location map URL
2. Used by found tag history and map page

Rules:

1. Null while tag is active
2. Set when the tag is found

### hidden_location_map_url

Type:

```text
text
```

Purpose:

1. Private map URL for the active tag location
2. Used only after someone finds the tag
3. Must not be returned by public read APIs

Rules:

1. Present for active tags
2. Hidden from public API responses
3. Null for found tags after handoff if no longer needed

### found_by

Type:

```text
text
```

Purpose:

1. Display rider name
2. Shows who posted or found a tag

Rules:

1. Required
2. Suggested max length is 50 characters

### status

Type:

```text
text
```

Purpose:

1. Identifies whether a tag is active or found

Allowed values:

```text
active
found
```

Rules:

1. Required
2. Only one active tag should exist

### created_at

Type:

```text
timestamptz
```

Purpose:

1. Timestamp for when the tag became active
2. Used for timer and clue unlock calculation

Rules:

1. Required
2. Defaults to current timestamp

### found_at

Type:

```text
timestamptz
```

Purpose:

1. Timestamp for when the tag was found
2. Used for sorting found tags

Rules:

1. Null for active tags
2. Set when a tag becomes found

### created_by_user_id

Type:

```text
uuid
```

Purpose:

1. Future authenticated user relationship
2. Not required for first version

### found_by_user_id

Type:

```text
uuid
```

Purpose:

1. Future authenticated user relationship
2. Not required for first version

### inserted_at

Type:

```text
timestamptz
```

Purpose:

1. Database insert timestamp
2. Useful for audit trails

### updated_at

Type:

```text
timestamptz
```

Purpose:

1. Database update timestamp
2. Automatically updated by trigger

## Constraints

### Status Check

The `status` column should only allow:

```text
active
found
```

### One Active Tag

The database should enforce one active tag at a time.

This is handled with a partial unique index:

```sql
create unique index if not exists one_active_tag
on public.tags ((status))
where status = 'active';
```

### Length Checks

The table should enforce reasonable limits for:

1. Title
2. Clue
3. Rider name

Recommended limits:

```text
title: 80 characters
clue: 500 characters
found_by: 50 characters
```

## Indexes

Recommended indexes:

```text
status
created_at
found_at
```

Purpose:

1. Fast active tag lookup
2. Fast found tag list lookup
3. Efficient history sorting

## Updated Timestamp Trigger

The table should have an `updated_at` trigger.

Purpose:

1. Keep `updated_at` current
2. Avoid manually setting it in every query
3. Support future audit and admin screens

## Storage Bucket

The storage bucket is:

```text
bike_tag_photos
```

The bucket stores:

1. Active tag photos
2. Match photos

Allowed image MIME types:

```text
image/jpeg
image/png
image/webp
```

Maximum file size:

```text
8 MB
```

HEIC is not supported yet.

Future HEIC support should convert HEIC uploads to jpg or webp before storage.

## Storage Path Plan

Current storage path shape:

```text
tags/{tagId}/{photoType}_{fileId}.{extension}
```

Supported photo types:

```text
tag_photo
match_photo
```

Examples:

```text
tags/00000000-0000-0000-0000-000000000001/tag_photo_abc123.jpg
tags/00000000-0000-0000-0000-000000000001/match_photo_def456.webp
```

## Database Function: submit_bike_tag

The submit function is:

```text
public.submit_bike_tag
```

Migration file:

```text
supabase/migrations/003_create_submit_tag_function.sql
```

Purpose:

1. Mark the current active tag as found
2. Store found location map URL
3. Store match photo URL
4. Create the next active tag
5. Store next tag photo URL
6. Store next hidden map URL privately
7. Return both tag ids

## Function Arguments

The function accepts:

```text
p_rider_name
p_found_location_map_url
p_match_photo_url
p_next_title
p_next_clue
p_next_hidden_location_map_url
p_next_tag_photo_url
```

All arguments are required.

## Function Return Shape

The function returns:

```text
found_tag_id
current_tag_id
```

The API uses these ids to return the new current tag response after submit.

## Function Permissions

The service role needs execute permission:

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

After creating or replacing the function, reload the Supabase schema cache:

```sql
notify pgrst, 'reload schema';
```

## Service Role Table Permissions

The service role needs access to the public schema and `tags` table.

```sql
grant usage on schema public to service_role;

grant select, insert, update, delete
on public.tags
to service_role;
```

The service role key must remain server only.

## Seed Data

The first migration seeds:

1. One active tag
2. Two found tags

Seed data exists so Supabase read mode can work before real user submissions.

Seed photo URLs may be empty during early testing.

## Public API Visibility

Public current tag response may include:

1. id
2. title
3. image URL
4. rider display name
5. status
6. created timestamp
7. clue unlock status
8. clue only when unlocked

Public current tag response must not include:

1. hidden location map URL

Public found tag response may include:

1. id
2. title
3. clue
4. image URL
5. found location map URL
6. rider display name
7. status
8. created timestamp

Public found tag response must not include:

1. hidden location map URL

## Row Level Security Plan

For the first server API version, the Nuxt server uses the service role key.

The service role key bypasses row level security and must stay server only.

Future public browser access should use:

1. Supabase Auth
2. Row level security
3. Public read policies
4. Restricted write policies
5. Admin moderation rules

## Future Tables

Future tables may include:

1. games
2. users
3. submissions
4. moderation_events
5. comments
6. reactions

## Future Games Table

A future `games` table could support multiple Bike Tag games.

Possible columns:

1. id
2. name
3. city
4. status
5. created_at
6. updated_at

If this table is added, `tags` should include:

```text
game_id
```

The one active tag rule would change from one active tag globally to one active tag per game.

## Future Moderation

Future moderation could support:

1. Pending submissions
2. Admin approval
3. Rejected submissions
4. Removed photos
5. Flagged locations
6. Audit history

This would likely require a `submissions` table before updating `tags`.

## Current Limitations

Current limitations:

1. No Supabase reset behavior yet
2. No uploaded photo cleanup if database submit fails
3. No image resizing
4. No image compression
5. No HEIC conversion
6. No Supabase Auth
7. No admin moderation
8. No multiple game support

## Done Criteria

The schema is ready for the current Supabase submit flow when:

1. `public.tags` exists
2. `bike_tag_photos` bucket exists
3. `public.submit_bike_tag` exists
4. Service role can read and write `public.tags`
5. Service role can execute `public.submit_bike_tag`
6. Supabase schema cache has been reloaded
7. One active tag exists before testing
8. Submit creates exactly one new active tag
9. Previous active tag becomes found
10. Hidden map URLs are not exposed through public APIs