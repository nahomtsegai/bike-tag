# Bike Tag Supabase Submit Smoke Test

## Purpose

This checklist verifies that Bike Tag can submit a found tag and create the next active tag when `NUXT_TAG_DATA_SOURCE` is set to `supabase`.

This test covers the real Supabase submit path:

1. Parse submit form data
2. Upload matching photo to Supabase Storage
3. Upload next tag photo to Supabase Storage
4. Call the `public.submit_bike_tag` database function
5. Mark the previous active tag as found
6. Create the next active tag
7. Render updated Supabase data in the app

## Prerequisites

Before starting, confirm these migration files have been applied to the Supabase project:

```text
supabase/migrations/001_create_tags_table.sql
supabase/migrations/002_create_storage_bucket.sql
supabase/migrations/003_create_submit_tag_function.sql
```

Confirm the Supabase project has:

1. The `tags` table
2. The `bike_tag_photos` storage bucket
3. The `public.submit_bike_tag` function
4. One active tag before testing
5. Service role permissions for the `public.tags` table
6. Execute permission for the `public.submit_bike_tag` function

## Required Local Environment Variables

Create or update the local `.env` file in the project root.

Do not commit `.env`.

Use this shape:

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

The service role key must stay server only.

## Service Role Table Permissions

If Supabase mode can connect but returns a permission error for `public.tags`, run this in the Supabase SQL Editor:

```sql
grant usage on schema public to service_role;

grant select, insert, update, delete
on public.tags
to service_role;
```

## Submit Function Permission

If Supabase submit returns an error that the function cannot be called, run this in the Supabase SQL Editor:

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

## Reload Supabase Schema Cache

After applying the submit function migration, reload the Supabase API schema cache.

Run this in the Supabase SQL Editor:

```sql
notify pgrst, 'reload schema';
```

This is important because the function may exist in the database before the Supabase API layer can call it.

## Confirm The Submit Function Exists

Run this in the Supabase SQL Editor:

```sql
select
  routine_schema,
  routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'submit_bike_tag';
```

Expected result:

```text
public | submit_bike_tag
```

## Step 1: Confirm Supabase Mode

Set local `.env` to:

```text
NUXT_TAG_DATA_SOURCE=supabase
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
  "tagDataSource": "supabase",
  "supabase": {
    "hasUrl": true,
    "hasServiceRoleKey": true,
    "storageBucket": "bike_tag_photos"
  }
}
```

## Step 2: Confirm Current Tag Before Submit

Open:

```text
http://localhost:3000/api/tags/current
```

Expected result:

1. One active tag is returned
2. `status` is `active`
3. `hiddenLocationMapUrl` is not returned

## Step 3: Submit A Tag From The App

Open:

```text
http://localhost:3000/submit
```

Fill out the form with:

1. Rider name
2. Found Google Maps link
3. Matching photo
4. Next tag title
5. Next clue
6. Next hidden Google Maps link
7. Next tag photo

Click review, then submit.

Expected result:

1. Submit succeeds
2. Success message appears
3. View current tag link appears
4. Current tag page shows the new active tag

## Step 4: Confirm Storage Uploads

In Supabase, open Storage and check the bucket:

```text
bike_tag_photos
```

Expected result:

1. A matching photo was uploaded
2. A next tag photo was uploaded
3. Upload paths start with `tags/`
4. Uploaded files are publicly readable through returned public URLs

## Step 5: Confirm Database Changes

In Supabase SQL Editor, run:

```sql
select
  id,
  title,
  status,
  tag_photo_url,
  match_photo_url,
  location_map_url,
  hidden_location_map_url,
  found_by,
  created_at,
  found_at
from public.tags
order by created_at desc;
```

Expected result:

1. The previous active tag now has `status = 'found'`
2. The previous active tag has `location_map_url`
3. The previous active tag has `match_photo_url`
4. A new tag exists with `status = 'active'`
5. The new active tag has `tag_photo_url`
6. The new active tag has `hidden_location_map_url`
7. There is only one active tag

## Step 6: Confirm Read APIs After Submit

Open:

```text
http://localhost:3000/api/tags/current
```

Expected result:

1. The new active tag is returned
2. `hiddenLocationMapUrl` is not returned
3. Locked clue behavior still applies

Open:

```text
http://localhost:3000/api/tags
```

Expected result:

1. The previous active tag appears in found tags
2. The found location map URL is returned
3. The hidden map URL is not returned

## Step 7: Confirm App Pages After Submit

Open:

```text
http://localhost:3000/current-tag
```

Expected result:

1. New active tag appears
2. Active hidden location remains hidden

Open:

```text
http://localhost:3000/tags
```

Expected result:

1. Previous active tag appears in history
2. Search still works

Open:

```text
http://localhost:3000/map
```

Expected result:

1. Found location appears on the map page
2. Active hidden location does not appear

## Common Errors

### Could not find the function public.submit_bike_tag

Run the `003_create_submit_tag_function.sql` migration.

Then run:

```sql
notify pgrst, 'reload schema';
```

Restart the Nuxt dev server and try again.

### Permission denied for table tags

Run:

```sql
grant usage on schema public to service_role;

grant select, insert, update, delete
on public.tags
to service_role;
```

### Function execute permission denied

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

### Submit works but app still shows old data

Check:

1. `NUXT_TAG_DATA_SOURCE` is set to `supabase`
2. The dev server was restarted after changing `.env`
3. `/api/system/data-source` shows `supabase`
4. `/api/tags/current` returns the new active tag

## Pass Criteria

This smoke test passes when:

1. Supabase mode is active
2. Submit succeeds from the app
3. Matching photo uploads to Supabase Storage
4. Next tag photo uploads to Supabase Storage
5. Previous active tag becomes found
6. New active tag is created
7. Current tag API returns the new active tag
8. Found tags API returns the previous active tag
9. Hidden map URLs are not exposed through public APIs
10. The app renders updated Supabase data