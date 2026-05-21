# Bike Tag Supabase Read Smoke Test

## Purpose

This checklist verifies that Bike Tag can read tag data from Supabase when `NUXT_TAG_DATA_SOURCE` is set to `supabase`.

Mock mode remains the default for normal local development. Supabase mode should only be used after the Supabase project, migrations, seed data, permissions, and local environment variables are ready.

## What This Test Covers

This smoke test verifies:

1. The app can switch from mock mode to Supabase mode
2. The server can read Supabase runtime config values
3. The current tag API can read from Supabase
4. The found tags API can read from Supabase
5. The app pages can render Supabase tag data
6. Hidden map URLs are not exposed in API responses
7. Locked clues are not exposed before unlock time
8. The app can switch back to mock mode

## Prerequisites

Before starting, confirm that these files exist:

```text
supabase/migrations/001_create_tags_table.sql
supabase/migrations/002_create_storage_bucket.sql
```

Confirm the Supabase project has:

1. The `tags` table
2. The `bike_tag_photos` storage bucket
3. One active tag
4. At least one found tag
5. Seed data or manually inserted test data
6. Service role permissions for the `public.tags` table

## Required Local Environment Variables

Create or update the local `.env` file in the project root.

Do not commit `.env`.

For Supabase read testing, use this shape:

```text
NUXT_TAG_DATA_SOURCE=supabase
NUXT_SUPABASE_URL=
NUXT_PUBLIC_SUPABASE_ANON_KEY=
NUXT_SUPABASE_SERVICE_ROLE_KEY=
NUXT_SUPABASE_STORAGE_BUCKET=bike_tag_photos
```

Required values for this smoke test:

1. `NUXT_TAG_DATA_SOURCE`
2. `NUXT_SUPABASE_URL`
3. `NUXT_SUPABASE_SERVICE_ROLE_KEY`
4. `NUXT_SUPABASE_STORAGE_BUCKET`

The anon key is already listed for future browser client use, but the current server read flow uses the service role key on the server.

## Safety Notes

Never commit real Supabase secrets.

The service role key must stay server only.

The data source status endpoint should only show whether values are configured. It should not return actual secret values.

## Service Role Table Permissions

If Supabase mode can connect to the project but returns a permission error for `public.tags`, grant the service role access to the schema and table.

Run this in the Supabase SQL Editor:

```sql
grant usage on schema public to service_role;

grant select, insert, update, delete
on public.tags
to service_role;
```

This is required because the Nuxt server reads Supabase through the server only service role key.

The service role key must stay server only and should never be exposed to browser code.

## Step 1: Start From Mock Mode

Set local `.env` to:

```text
NUXT_TAG_DATA_SOURCE=mock
```

Start the app:

```bash
npm run dev
```

Open:

```text
http://localhost:3000/settings
```

Expected result:

1. Settings loads
2. Data source panel shows `mock`
3. Supabase URL may show configured or not configured
4. Supabase service role key may show configured or not configured
5. Storage bucket shows `bike_tag_photos`

Open:

```text
http://localhost:3000/api/system/data-source
```

Expected result:

```json
{
  "tagDataSource": "mock",
  "supabase": {
    "hasUrl": true,
    "hasServiceRoleKey": true,
    "storageBucket": "bike_tag_photos"
  }
}
```

The `hasUrl` and `hasServiceRoleKey` values may be `false` if local Supabase values have not been added yet.

## Step 2: Switch To Supabase Mode

Update `.env`:

```text
NUXT_TAG_DATA_SOURCE=supabase
NUXT_SUPABASE_URL=your Supabase project URL
NUXT_PUBLIC_SUPABASE_ANON_KEY=your Supabase anon key
NUXT_SUPABASE_SERVICE_ROLE_KEY=your Supabase service role key
NUXT_SUPABASE_STORAGE_BUCKET=bike_tag_photos
```

Restart the dev server:

```bash
npm run dev
```

Environment variable changes require a restart.

## Step 3: Confirm Server Mode

Open:

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

If `tagDataSource` still shows `mock`, check:

1. `.env` was saved
2. The dev server was restarted
3. The environment variable name is exactly `NUXT_TAG_DATA_SOURCE`
4. The value is exactly `supabase`

If `hasUrl` is `false`, check `NUXT_SUPABASE_URL`.

If `hasServiceRoleKey` is `false`, check `NUXT_SUPABASE_SERVICE_ROLE_KEY`.

## Step 4: Test Current Tag API

Open:

```text
http://localhost:3000/api/tags/current
```

Expected result:

1. Response returns one active tag
2. `status` is `active`
3. `id` is present
4. `title` is present
5. `imageUrl` is present, even if empty during seed testing
6. `createdAtIso` is present
7. `clueIsUnlocked` is present
8. `clueUnlocksAtIso` is present
9. `hiddenLocationMapUrl` is not present

Example shape:

```json
{
  "id": "00000000-0000-0000-0000-000000000001",
  "title": "Find the overlook",
  "imageUrl": "",
  "foundBy": "Sample Rider",
  "createdAt": "05/17/2026",
  "createdAtIso": "2026-05-17T14:00:00.000Z",
  "status": "active",
  "clueIsUnlocked": false,
  "clueUnlocksAtIso": "2026-05-22T14:00:00.000Z"
}
```

The exact values may differ based on Supabase seed data.

## Step 5: Test Found Tags API

Open:

```text
http://localhost:3000/api/tags
```

Expected result:

1. Response returns an array
2. Each returned tag has `status` set to `found`
3. Found tag titles are present
4. Found tag clues are present
5. Found map URLs are present when available
6. `hiddenLocationMapUrl` is not present

Example shape:

```json
[
  {
    "id": "00000000-0000-0000-0000-000000000002",
    "title": "River trail mural",
    "clue": "Look for the painted wall near the path.",
    "imageUrl": "",
    "locationMapUrl": "https://www.google.com/maps/search/?api=1&query=River%20trail",
    "foundBy": "Sample Rider",
    "createdAt": "05/10/2026",
    "createdAtIso": "2026-05-10T14:00:00.000Z",
    "status": "found"
  }
]
```

## Step 6: Test App Pages

Open:

```text
http://localhost:3000/current-tag
```

Expected result:

1. Page loads
2. Current tag card renders
3. Active tag location remains hidden
4. Submit callout still appears

Open:

```text
http://localhost:3000/tags
```

Expected result:

1. Previous tags page loads
2. Found tags appear
3. Search still works
4. Active tag does not appear

Open:

```text
http://localhost:3000/map
```

Expected result:

1. Map page loads
2. Found locations appear when found tags have public map links
3. Active tag location does not appear

Open a tag detail route from the Tags page.

Expected result:

1. Tag detail page loads
2. Found tag clue appears
3. Found tag map link appears when available
4. Hidden map URL is not exposed

## Step 7: Check Server Errors

If Supabase mode is enabled but the current tag route fails, open:

```text
http://localhost:3000/api/tags/current
```

Useful error messages may include:

1. Missing required environment variable: `NUXT_SUPABASE_URL`
2. Missing required environment variable: `NUXT_SUPABASE_SERVICE_ROLE_KEY`
3. No active tag exists in Supabase
4. Could not load current tag from Supabase
5. Permission denied for table tags

Use these messages to check:

1. Environment variables
2. Supabase project status
3. Applied migrations
4. Seed data
5. Active tag status
6. Service role table permissions

## Step 8: Switch Back To Mock Mode

Update `.env`:

```text
NUXT_TAG_DATA_SOURCE=mock
```

Restart the dev server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000/api/system/data-source
```

Expected result:

```json
{
  "tagDataSource": "mock",
  "supabase": {
    "hasUrl": true,
    "hasServiceRoleKey": true,
    "storageBucket": "bike_tag_photos"
  }
}
```

Open:

```text
http://localhost:3000/current-tag
```

Expected result:

1. App reads from the mock server store again
2. Submit updates the mock server store
3. Reset mock game data works from Settings
4. Supabase reads are no longer used

## Known Limitations

Supabase mode is currently read focused.

Current limitations:

1. Submit still writes to the mock server store
2. Reset still resets the mock server store
3. Photos are not uploaded to Supabase Storage yet
4. Seed photo URLs may be empty
5. HEIC uploads are not supported yet
6. Supabase Auth is not enabled yet
7. Admin moderation does not exist yet

## Pass Criteria

This smoke test passes when:

1. Settings shows `supabase` mode
2. Data source status endpoint confirms Supabase config is present
3. Current tag API returns the active Supabase tag
4. Found tags API returns Supabase found tags
5. App pages render Supabase read data
6. Hidden map URLs are not exposed
7. Locked clues are not exposed before unlock time
8. App can switch back to mock mode