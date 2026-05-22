# Bike Tag Supabase Submit Smoke Test

## Purpose

This checklist verifies that Bike Tag can submit a found tag and create a pending submission when `NUXT_TAG_DATA_SOURCE` is set to `supabase`.

This test covers the moderated Supabase submit path:

1. Parse submit form data
2. Upload matching photo to Supabase Storage
3. Upload next tag photo to Supabase Storage
4. Call the `public.create_pending_submission` database function
5. Create a pending submission
6. Keep the current active tag unchanged
7. Allow admin approval or rejection through protected admin routes

## Prerequisites

Before starting, confirm these migration files have been applied to the Supabase project:

```text
supabase/migrations/001_create_tags_table.sql
supabase/migrations/002_create_storage_bucket.sql
supabase/migrations/003_create_submit_tag_function.sql
supabase/migrations/004_create_submissions_table.sql
supabase/migrations/005_create_pending_submission_function.sql
supabase/migrations/006_create_approve_submission_function.sql
supabase/migrations/007_create_reject_submission_function.sql
```

Confirm the Supabase project has:

1. The `tags` table
2. The `submissions` table
3. The `bike_tag_photos` storage bucket
4. The `public.create_pending_submission` function
5. The `public.approve_submission` function
6. The `public.reject_submission` function
7. One active tag before testing
8. Service role permissions for the `public.tags` table
9. Service role permissions for the `public.submissions` table
10. Execute permission for moderation functions

## Required Local Environment Variables

Create or update the local `.env` file in the project root.

Do not commit `.env`.

Use this shape:

```text
NUXT_TAG_DATA_SOURCE=supabase
NUXT_SUBMIT_RATE_LIMIT_ATTEMPTS=10
NUXT_SUBMIT_RATE_LIMIT_WINDOW_MS=600000
NUXT_ADMIN_API_TOKEN=local-admin-test-token
NUXT_SUPABASE_URL=
NUXT_PUBLIC_SUPABASE_ANON_KEY=
NUXT_SUPABASE_SERVICE_ROLE_KEY=
NUXT_SUPABASE_STORAGE_BUCKET=bike_tag_photos
```

Required values for this smoke test:

1. `NUXT_TAG_DATA_SOURCE`
2. `NUXT_ADMIN_API_TOKEN`
3. `NUXT_SUPABASE_URL`
4. `NUXT_SUPABASE_SERVICE_ROLE_KEY`
5. `NUXT_SUPABASE_STORAGE_BUCKET`

The service role key must stay server only.

The admin API token must stay server only.

## Service Role Table Permissions

If Supabase mode can connect but returns a permission error for `public.tags`, run this in the Supabase SQL Editor:

```sql
grant usage on schema public to service_role;

grant select, insert, update, delete
on public.tags
to service_role;
```

If Supabase mode can connect but returns a permission error for `public.submissions`, run this in the Supabase SQL Editor:

```sql
grant select, insert, update, delete
on public.submissions
to service_role;
```

## Moderation Function Permissions

If Supabase submit or admin review returns an error that a function cannot be called, run these in the Supabase SQL Editor:

```sql
grant execute on function public.create_pending_submission(
  text,
  text,
  text,
  text,
  text,
  text,
  text
) to service_role;

grant execute on function public.approve_submission(
  uuid,
  text
) to service_role;

grant execute on function public.reject_submission(
  uuid,
  text,
  text
) to service_role;
```

## Reload Supabase Schema Cache

After applying or replacing moderation functions, reload the Supabase API schema cache.

Run this in the Supabase SQL Editor:

```sql
notify pgrst, 'reload schema';
```

This is important because the function may exist in the database before the Supabase API layer can call it.

## Confirm Moderation Functions Exist

Run this in the Supabase SQL Editor:

```sql
select
  routine_schema,
  routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'create_pending_submission',
    'approve_submission',
    'reject_submission'
  )
order by routine_name;
```

Expected result:

```text
public | approve_submission
public | create_pending_submission
public | reject_submission
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
http://localhost:3000/api/tags/current
```

Expected result:

1. One active tag is returned
2. `status` is `active`
3. `hiddenLocationMapUrl` is not returned

## Step 2: Confirm Current Tag Before Submit

In Supabase SQL Editor, run:

```sql
select
  id,
  title,
  status,
  created_at
from public.tags
where status = 'active';
```

Expected result:

1. Exactly one active tag exists
2. Copy the active tag id for comparison after submit

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
2. Message says submission was received and is pending review
3. A submission id is returned
4. Current tag page still shows the same active tag

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

## Step 4A: Understand Failed Submit Cleanup

Supabase submit tracks uploaded storage paths during the request.

If photo uploads succeed but pending submission creation fails, the API attempts to delete the uploaded photos from Supabase Storage.

Expected cleanup behavior:

1. Uploaded photo paths are tracked during submit
2. Pending submission creation is attempted after uploads
3. If pending submission creation fails, uploaded photos are deleted
4. The original submit error is still returned
5. Cleanup errors are logged on the server
6. Cleanup errors do not hide the original submit failure

## Step 5: Confirm Pending Submission Was Created

In Supabase SQL Editor, run:

```sql
select
  id,
  active_tag_id,
  rider_name,
  found_location_map_url,
  match_photo_url,
  next_title,
  next_clue,
  next_hidden_location_map_url,
  next_tag_photo_url,
  status,
  created_at
from public.submissions
where status = 'pending'
order by created_at desc;
```

Expected result:

1. A new pending submission exists
2. `status = 'pending'`
3. `active_tag_id` matches the current active tag from before submit
4. `match_photo_url` is present
5. `next_tag_photo_url` is present
6. Proposed next tag fields are stored
7. The active tag has not changed

## Step 6: Confirm Active Tag Did Not Change After Public Submit

Run:

```sql
select
  id,
  title,
  status,
  created_at
from public.tags
where status = 'active';
```

Expected result:

1. Exactly one active tag exists
2. The active tag id is the same as before submit
3. Public submit did not create a new active tag
4. Public submit did not mark the active tag as found

## Step 7: Test Admin Rejection With Bad Token

Use any pending submission id.

Run:

```bash
curl -X POST http://localhost:3000/api/admin/submissions/YOUR_PENDING_SUBMISSION_ID/reject \
  -H "Authorization: Bearer wrong-token" \
  -H "Content-Type: application/json" \
  -d '{"reviewedBy":"Nahom","rejectionReason":"Testing bad token"}'
```

Expected result:

```text
403 Admin access is required.
```

This confirms the admin route blocks invalid tokens.

## Step 8: Test Admin Rejection With Valid Token

Use a real pending submission id.

Run:

```bash
curl -X POST http://localhost:3000/api/admin/submissions/YOUR_PENDING_SUBMISSION_ID/reject \
  -H "Authorization: Bearer local-admin-test-token" \
  -H "Content-Type: application/json" \
  -d '{"reviewedBy":"Nahom","rejectionReason":"Testing admin rejection"}'
```

Expected result:

```json
{
  "success": true,
  "message": "Submission rejected.",
  "submissionId": "YOUR_PENDING_SUBMISSION_ID",
  "status": "rejected"
}
```

Confirm in Supabase:

```sql
select
  id,
  status,
  rejection_reason,
  reviewed_at,
  reviewed_by
from public.submissions
where id = 'YOUR_PENDING_SUBMISSION_ID';
```

Expected result:

1. `status = 'rejected'`
2. `rejection_reason` is stored
3. `reviewed_by` is stored
4. `reviewed_at` has a timestamp
5. Active tag remains unchanged

## Step 9: Create Another Pending Submission For Approval

Create a second pending submission from the app.

Then run:

```sql
select
  id,
  status,
  created_at
from public.submissions
where status = 'pending'
order by created_at desc;
```

Copy the newest pending submission id.

## Step 10: Test Admin Approval With Bad Token

Run:

```bash
curl -X POST http://localhost:3000/api/admin/submissions/YOUR_PENDING_SUBMISSION_ID/approve \
  -H "Authorization: Bearer wrong-token" \
  -H "Content-Type: application/json" \
  -d '{"reviewedBy":"Nahom"}'
```

Expected result:

```text
403 Admin access is required.
```

This confirms the approval route blocks invalid tokens.

## Step 11: Test Admin Approval With Valid Token

Use a real pending submission id.

Run:

```bash
curl -X POST http://localhost:3000/api/admin/submissions/YOUR_PENDING_SUBMISSION_ID/approve \
  -H "Authorization: Bearer local-admin-test-token" \
  -H "Content-Type: application/json" \
  -d '{"reviewedBy":"Nahom"}'
```

Expected result:

```json
{
  "success": true,
  "message": "Submission approved.",
  "submissionId": "YOUR_PENDING_SUBMISSION_ID",
  "foundTagId": "FOUND_TAG_ID",
  "currentTag": {
    "id": "NEW_CURRENT_TAG_ID",
    "status": "active"
  }
}
```

## Step 12: Confirm Database Changes After Approval

In Supabase SQL Editor, run:

```sql
select
  id,
  status,
  reviewed_at,
  reviewed_by
from public.submissions
where id = 'YOUR_PENDING_SUBMISSION_ID';
```

Expected result:

1. `status = 'approved'`
2. `reviewed_by` is stored
3. `reviewed_at` has a timestamp

Run:

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

## Step 13: Confirm Read APIs After Approval

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

## Step 14: Confirm App Pages After Approval

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

### Could not find a moderation function

Run the related migration.

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

### Permission denied for table submissions

Run:

```sql
grant select, insert, update, delete
on public.submissions
to service_role;
```

### Function execute permission denied

Run the grants for moderation functions:

```sql
grant execute on function public.create_pending_submission(
  text,
  text,
  text,
  text,
  text,
  text,
  text
) to service_role;

grant execute on function public.approve_submission(
  uuid,
  text
) to service_role;

grant execute on function public.reject_submission(
  uuid,
  text,
  text
) to service_role;
```

### Admin route returns 403

Check:

1. `NUXT_ADMIN_API_TOKEN` is set in `.env`
2. Dev server was restarted after changing `.env`
3. Request uses `Authorization: Bearer your_admin_token`
4. Header token exactly matches the `.env` value

### Admin route returns 500

Current admin route behavior returns `500` for some database failures.

Common causes:

1. Submission does not exist
2. Submission is not pending
3. Submission was already approved
4. Submission was already rejected
5. Related active tag is no longer active

Future improvement should return cleaner `404` or `409` statuses for these cases.

### Submit works but app still shows old data

This is expected after public submit.

Public submit creates a pending submission and does not change the active tag.

The active tag changes only after admin approval.

## Pass Criteria

This smoke test passes when:

1. Supabase mode is active
2. Public submit succeeds from the app
3. Matching photo uploads to Supabase Storage
4. Next tag photo uploads to Supabase Storage
5. Pending submission is created
6. Current active tag remains unchanged after public submit
7. Admin rejection requires valid admin token
8. Admin rejection marks a pending submission as rejected
9. Admin rejection leaves active tag unchanged
10. Admin approval requires valid admin token
11. Admin approval marks pending submission as approved
12. Admin approval marks previous active tag as found
13. Admin approval creates a new active tag
14. Current tag API returns the new active tag after approval
15. Found tags API returns the previous active tag after approval
16. Hidden map URLs are not exposed through public APIs
17. Failed pending submission creation attempts clean up uploaded photos when possible