# Bike Tag Supabase Read Mode Notes

## Purpose

Bike Tag can choose where tag read APIs get their data.

The supported data sources are:

1. Mock server store
2. Supabase

Mock mode remains the default for normal local development. Supabase mode is available for local testing once the Supabase project, migrations, seed data, permissions, and environment variables are ready.

## Current Default Mode

The app should default to:

```text
mock
```

That means tag read APIs use the in memory mock server store.

These routes read from the configured data source:

```text
GET /api/tags/current
GET /api/tags
GET /api/tags/:id
```

The submit route also uses the configured data source:

```text
POST /api/tags/submit
```

Reset currently remains mock focused:

```text
POST /api/tags/reset
```

## Data Source Environment Variable

The data source is controlled by:

```text
NUXT_TAG_DATA_SOURCE
```

Supported values:

```text
mock
supabase
```

Recommended local default:

```text
NUXT_TAG_DATA_SOURCE=mock
```

## Mock Mode

Mock mode uses the in memory server tag store.

Example local configuration:

```text
NUXT_TAG_DATA_SOURCE=mock
```

Mock mode behavior:

1. Read APIs return data from the mock server store
2. Submit API updates the mock server store
3. Reset API restores sample data in the mock server store
4. Restarting the dev server resets the mock server store
5. Supabase credentials are not required

Mock mode is best for:

1. Normal local app development
2. Submit flow testing without a backend
3. UI testing
4. Working without a Supabase project

## Supabase Mode

Supabase mode uses the Supabase `tags` table for read APIs.

Example local configuration:

```text
NUXT_TAG_DATA_SOURCE=supabase
NUXT_SUPABASE_URL=
NUXT_PUBLIC_SUPABASE_ANON_KEY=
NUXT_SUPABASE_SERVICE_ROLE_KEY=
NUXT_SUPABASE_STORAGE_BUCKET=bike_tag_photos
```

Supabase mode behavior:

1. Current tag reads come from Supabase
2. Found tag reads come from Supabase
3. Tag detail reads come from Supabase
4. Submit uploads photos to Supabase Storage
5. Submit calls the `public.submit_bike_tag` database function
6. Reset still resets the mock server store for now

Supabase mode is best for:

1. Verifying database migrations
2. Verifying seed data
3. Testing read API behavior against real database rows
4. Testing real submit behavior
5. Preparing for future production deployment

## Required Supabase Setup

Before using Supabase mode, complete these steps:

1. Create the Supabase project
2. Add local environment variables
3. Apply the tags table migration
4. Apply the storage bucket migration
5. Apply the submit function migration
6. Confirm seed data exists
7. Confirm one active tag exists
8. Confirm at least one found tag exists
9. Confirm service role permissions for `public.tags`
10. Confirm execute permission for `public.submit_bike_tag`
11. Reload the Supabase schema cache after function changes

Required migration files:

```text
supabase/migrations/001_create_tags_table.sql
supabase/migrations/002_create_storage_bucket.sql
supabase/migrations/003_create_submit_tag_function.sql
```

## Required Environment Variables

Supabase mode needs these variables:

```text
NUXT_TAG_DATA_SOURCE=supabase
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

## Service Role Table Permissions

If Supabase mode can connect to the project but returns a permission error for `public.tags`, grant the service role access to the schema and table.

Run this in the Supabase SQL Editor:

```sql
grant usage on schema public to service_role;

grant select, insert, update, delete
on public.tags
to service_role;
```

## Submit Function Permission

If submit returns a function permission error, grant execute permission.

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

## Reload Schema Cache

After creating or replacing the submit function, reload the Supabase schema cache.

Run this in the Supabase SQL Editor:

```sql
notify pgrst, 'reload schema';
```

This helps the Supabase API layer discover the new or updated function.

## Smoke Test Steps

### 1. Start in mock mode

Set:

```text
NUXT_TAG_DATA_SOURCE=mock
```

Start the app:

```text
npm run dev
```

Check these pages:

```text
/current-tag
/tags
/map
/settings
```

Expected result:

1. Current tag loads
2. Previous tags load
3. Map locations load
4. Settings shows `mock`
5. Submit flow works
6. Reset mock game data works

### 2. Switch to Supabase mode

Set:

```text
NUXT_TAG_DATA_SOURCE=supabase
```

Restart the dev server:

```text
npm run dev
```

Check the status endpoint:

```text
http://localhost:3000/api/system/data-source
```

Expected result:

```json
{
  "tagDataSource": "supabase",
  "supabase": {
    "hasUrl": true,
    "hasServiceRoleKey": true,
    "storageBucket": "bike_tag_photos"
  }
}
```

### 3. Check read APIs in Supabase mode

Open these API routes in the browser:

```text
http://localhost:3000/api/tags/current
http://localhost:3000/api/tags
```

Expected result:

1. Current tag API returns the active Supabase tag
2. Found tags API returns found Supabase tags
3. Hidden map URLs are not returned
4. Locked clues are not returned before unlock time
5. No Supabase service role key appears in responses

### 4. Check app pages in Supabase mode

Open:

```text
/current-tag
/tags
/map
/settings
```

Expected result:

1. Current tag page loads from Supabase data
2. Tags page loads found tags from Supabase data
3. Map page loads found locations from Supabase data
4. Tag detail pages load from Supabase data
5. Settings shows `supabase`

### 5. Check submit in Supabase mode

Open:

```text
/submit
```

Submit a tag with:

1. Rider name
2. Found Google Maps link
3. Matching photo
4. Next tag title
5. Next clue
6. Next hidden Google Maps link
7. Next tag photo

Expected result:

1. Submit succeeds
2. Matching photo uploads to Supabase Storage
3. Next tag photo uploads to Supabase Storage
4. Previous active tag becomes found
5. New active tag is created
6. Current tag page shows the new active tag
7. Tags page shows the previous tag in history

## Switching Back to Mock Mode

Set:

```text
NUXT_TAG_DATA_SOURCE=mock
```

Restart the dev server:

```text
npm run dev
```

Expected result:

1. App returns to mock server store reads
2. Supabase credentials are no longer required for normal local development
3. Submit works with mock data
4. Reset works with mock data

## Known Limitations

Current limitations:

1. Reset does not reset Supabase data yet
2. Photos are not resized
3. Photos are not compressed
4. HEIC uploads are not supported yet
5. Supabase Auth is not enabled yet
6. Admin moderation does not exist yet
7. Uploaded photo cleanup is not implemented if database submit fails

## Common Troubleshooting

### Current tag API fails

Check:

1. `NUXT_TAG_DATA_SOURCE` is set correctly
2. Supabase URL is present
3. Service role key is present
4. Tags table migration has been applied
5. There is exactly one active tag
6. Service role permissions are configured

### Found tags API returns an empty list

Check:

1. Seed data exists
2. Found tags have `status` set to `found`
3. Found tags have `found_at` values
4. Supabase mode is enabled

### App works in mock mode but not Supabase mode

Check:

1. Supabase environment variables
2. Applied migrations
3. Supabase project status
4. Service role permissions
5. Local dev server was restarted after changing `.env`

### Submit cannot find `public.submit_bike_tag`

Check:

1. Migration `003_create_submit_tag_function.sql` was applied
2. Supabase schema cache was reloaded
3. Dev server was restarted

Run:

```sql
notify pgrst, 'reload schema';
```

### Submit function permission denied

Run:

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

### Submit succeeds but Supabase data does not appear

Check:

1. `NUXT_TAG_DATA_SOURCE=supabase`
2. Dev server was restarted
3. `/api/system/data-source` shows `supabase`
4. `/api/tags/current` returns the new active tag
5. `/api/tags` returns the previous tag as found

## Next Implementation Step

The next implementation step should be:

```text
Improve Supabase submit user feedback and Settings status.
```

After that, the next larger step should be:

```text
Add cleanup for uploaded photos if database submit fails.
```