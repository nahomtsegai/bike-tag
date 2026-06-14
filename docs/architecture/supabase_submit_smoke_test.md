# Bike Tag Supabase Submit Smoke Test

## Purpose

This checklist verifies the complete moderated submission lifecycle when:

```text
NUXT_TAG_DATA_SOURCE=supabase
```

The current lifecycle is:

1. Validate the submitted fields and photos
2. Upload both photos to the private pending-photo bucket
3. Store private object paths on a pending submission
4. Generate temporary signed URLs for authenticated admin review
5. Copy approved photos to the public bucket
6. Update the game state in one database transaction
7. Remove private photos after approval or rejection when possible

## Prerequisites

Confirm these migrations have reached the Supabase project:

```text
supabase/migrations/20260614150000_add_private_pending_photo_storage.sql
supabase/migrations/20260614170000_use_private_pending_photo_lifecycle.sql
```

Confirm the project contains:

1. `public.tags`
2. `public.submissions`
3. Public bucket `bike_tag_photos`
4. Private bucket `bike_tag_pending_photos`
5. `public.create_private_pending_submission`
6. `public.approve_submission_with_public_photos`
7. `public.reject_submission`
8. One active tag
9. An admin Auth user with a matching row in `public.admin_users`

Verify the new functions:

```sql
select
  routine_schema,
  routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'create_private_pending_submission',
    'approve_submission_with_public_photos',
    'reject_submission'
  )
order by routine_name;
```

Expected result:

```text
public | approve_submission_with_public_photos
public | create_private_pending_submission
public | reject_submission
```

## Required Local Environment

Use this shape in local `.env`:

```text
NUXT_TAG_DATA_SOURCE=supabase
NUXT_SUBMIT_RATE_LIMIT_ATTEMPTS=10
NUXT_SUBMIT_RATE_LIMIT_WINDOW_MS=600000
NUXT_SUPABASE_URL=
NUXT_PUBLIC_SUPABASE_ANON_KEY=
NUXT_SUPABASE_SERVICE_ROLE_KEY=
NUXT_SUPABASE_STORAGE_BUCKET=bike_tag_photos
NUXT_SUPABASE_PENDING_STORAGE_BUCKET=bike_tag_pending_photos
NUXT_ADMIN_PHOTO_SIGNED_URL_TTL_SECONDS=28800
```

Keep the service-role key server-only and do not commit `.env`.

Restart the app after changing environment values:

```bash
npm run dev
```

## Step 1: Record The Current Active Tag

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
2. Save its id for comparison after submission and review

## Step 2: Create A Pending Submission

Open:

```text
http://localhost:3000/submit
```

Complete all required fields, select both photos, review, and submit.

You can also submit from the terminal while the local server is running:

```bash
curl -X POST http://localhost:3000/api/tags/submit \
  -F "riderName=Test Rider" \
  -F "foundLocationMapUrl=https://www.google.com/maps/search/?api=1&query=Louisville" \
  -F "matchPhoto=@${HOME}/Desktop/tag.png;type=image/png" \
  -F "nextTitle=Test Pending Tag" \
  -F "nextClue=This is a test clue." \
  -F "nextHiddenLocationMapUrl=https://www.google.com/maps/search/?api=1&query=Louisville" \
  -F "nextPhoto=@${HOME}/Desktop/tag.png;type=image/png"
```

Expected response:

```json
{
  "success": true,
  "message": "Submission received and pending review.",
  "submissionId": "SUBMISSION_ID",
  "status": "pending"
}
```

## Step 3: Verify The Pending Database Row

Run:

```sql
select
  id,
  active_tag_id,
  rider_name,
  match_photo_url,
  match_photo_storage_path,
  next_tag_photo_url,
  next_tag_photo_storage_path,
  found_latitude,
  found_longitude,
  next_hidden_latitude,
  next_hidden_longitude,
  status,
  created_at
from public.submissions
where status = 'pending'
order by created_at desc;
```

Expected result for the new row:

1. `status = 'pending'`
2. `active_tag_id` matches the tag recorded in Step 1
3. `match_photo_url` is null
4. `next_tag_photo_url` is null
5. Both private storage-path columns are populated
6. Captured location fields are present when the browser supplied them

## Step 4: Verify Private Storage

Open the `bike_tag_pending_photos` bucket in Supabase Storage.

Expected result:

1. Two objects exist under one `submissions/{submissionGroupId}/` folder
2. One object is a match photo
3. One object is a next-tag photo
4. The bucket shows `public = false`
5. An unauthenticated direct object request is denied

If pending-row creation fails after upload, the API should attempt to remove both
private objects while preserving the original submission error.

## Step 5: Verify The Active Tag Did Not Change

Run the Step 1 query again.

Expected result:

1. The same tag remains active
2. Public submission did not mark it found
3. Public submission did not create the proposed next tag

## Step 6: Verify Admin Signed URLs

Sign in at:

```text
http://localhost:3000/admin/submissions
```

Select the new pending submission.

Expected result:

1. Both photo previews load
2. The detail response contains temporary signed URLs
3. Reloading or reopening the detail creates fresh signed URLs
4. Signed URLs are not written to `public.submissions`
5. Merely loading the submission list does not generate signed URLs

The configured review window is:

```text
28800 seconds / 8 hours
```

## Step 7: Verify Rejection Cleanup

Create a pending submission specifically for rejection, then reject it through
the admin page.

Confirm the row:

```sql
select
  id,
  status,
  rejection_reason,
  reviewed_at,
  reviewed_by,
  match_photo_storage_path,
  next_tag_photo_storage_path
from public.submissions
where id = 'YOUR_REJECTED_SUBMISSION_ID';
```

Expected result:

1. `status = 'rejected'`
2. Review metadata is stored
3. The active tag remains unchanged
4. The private objects no longer exist in Storage
5. Reopening the rejected detail states that photos are unavailable

The path values may remain on the rejected row so a later deletion can retry
cleanup if the initial Storage deletion failed.

## Step 8: Verify Approval Promotion

Create another pending submission and approve it through the admin page.

Expected API result:

```json
{
  "success": true,
  "message": "Submission approved.",
  "submissionId": "SUBMISSION_ID",
  "foundTagId": "FOUND_TAG_ID",
  "currentTag": {
    "id": "NEW_CURRENT_TAG_ID",
    "status": "active"
  }
}
```

Confirm the submission:

```sql
select
  id,
  status,
  match_photo_url,
  match_photo_storage_path,
  next_tag_photo_url,
  next_tag_photo_storage_path,
  reviewed_at,
  reviewed_by
from public.submissions
where id = 'YOUR_APPROVED_SUBMISSION_ID';
```

Expected result:

1. `status = 'approved'`
2. Both URL columns contain permanent public URLs
3. Both private storage-path columns are null
4. Review metadata is stored

Confirm Storage:

1. Two approved copies exist in `bike_tag_photos` under `tags/{submissionId}/`
2. The private source objects were removed
3. The approved public URLs load without an admin session

Confirm game state:

```sql
select
  id,
  title,
  status,
  tag_photo_url,
  match_photo_url,
  location_map_url,
  hidden_location_map_url,
  found_latitude,
  found_longitude,
  hidden_latitude,
  hidden_longitude,
  found_by,
  created_at,
  found_at
from public.tags
order by created_at desc;
```

Expected result:

1. The previous active tag is now found
2. Its public match-photo URL and captured found location are preserved
3. A new active tag exists
4. Its public tag-photo URL and hidden location metadata are preserved
5. Exactly one tag is active

## Step 9: Verify Public APIs And Pages

Open:

```text
http://localhost:3000/api/tags/current
http://localhost:3000/api/tags
http://localhost:3000/current-tag
http://localhost:3000/tags
http://localhost:3000/map
```

Expected result:

1. The new active tag is returned on the current-tag routes
2. The previous tag appears in history
3. The found location appears where expected
4. The active hidden location is not exposed through public APIs
5. Approved photos load from the public bucket

## Rollback Behavior To Exercise In Tests

Automated tests should continue covering these failure paths:

1. A failed pending-row insert removes uploaded private photos
2. A failed second promotion removes the first public copy
3. A failed approval transaction removes all new public copies
4. Failed approval retains private originals for another review attempt
5. Failed post-approval private cleanup does not reverse a successful approval
6. Rejection cleanup failures do not erase review metadata

## Common Errors

### New moderation function is not found

Confirm migration `20260614170000_use_private_pending_photo_lifecycle.sql` is in
`supabase_migrations.schema_migrations`, then reload the API schema cache:

```sql
notify pgrst, 'reload schema';
```

### Pending bucket is missing

Confirm migration `20260614150000_add_private_pending_photo_storage.sql` ran and
that the configured value is:

```text
NUXT_SUPABASE_PENDING_STORAGE_BUCKET=bike_tag_pending_photos
```

### Admin photos do not load

Check:

1. The submission has private storage paths
2. The objects exist in `bike_tag_pending_photos`
3. The service-role key is configured on the server
4. `NUXT_ADMIN_PHOTO_SIGNED_URL_TTL_SECONDS` is a positive integer
5. The admin session is valid

### Approval succeeds but private objects remain

The database transaction has already completed. Review server logs for the
private cleanup failure and remove the orphaned objects after confirming that
the public copies and approved tag records are valid.

## Pass Criteria

This smoke test passes when:

1. New submissions upload both photos privately
2. Pending rows store paths instead of permanent URLs
3. The active tag remains unchanged before review
4. Authenticated admins receive working temporary photo URLs
5. Rejection removes private photos and preserves review metadata
6. Approval publishes both photos and clears private paths
7. Approval preserves captured found and hidden location metadata
8. Partial approval failures roll back public copies
9. Existing legacy public-URL submissions remain reviewable
10. Public APIs continue hiding active-location secrets
