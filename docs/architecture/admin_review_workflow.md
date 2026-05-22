# Bike Tag Admin Review Workflow

## Purpose

This document explains how to manually review Bike Tag submissions using the protected admin API routes and the admin review page.

The admin workflow supports reviewing public submissions before they affect the live game state.

## Current Admin Capabilities

Admin routes and the admin review page currently support:

1. Listing submissions
2. Filtering submissions by status
3. Searching submissions
4. Paginating submission results
5. Viewing one submission
6. Approving a pending submission
7. Rejecting a pending submission
8. Clearing the local admin token

## Admin Review Page

The admin review page is available at:

```text
/admin/submissions
```

This page provides a browser based admin workflow for reviewing submissions.

The page supports:

1. Entering an admin token
2. Validating the token against protected admin routes
3. Listing submissions after access is validated
4. Filtering by status
5. Searching submissions
6. Paginating results
7. Viewing submission details
8. Opening map and photo links
9. Approving pending submissions
10. Rejecting pending submissions with an optional reason

## Required Local Environment

Use this shape in local `.env`:

```text
NUXT_TAG_DATA_SOURCE=supabase
NUXT_SUBMIT_RATE_LIMIT_ATTEMPTS=10
NUXT_SUBMIT_RATE_LIMIT_WINDOW_MS=600000
NUXT_ADMIN_API_TOKEN=local_admin_test_token
NUXT_SUPABASE_URL=
NUXT_PUBLIC_SUPABASE_ANON_KEY=
NUXT_SUPABASE_SERVICE_ROLE_KEY=
NUXT_SUPABASE_STORAGE_BUCKET=bike_tag_photos
```

Important:

1. `NUXT_ADMIN_API_TOKEN` must stay server only
2. Do not use `NUXT_PUBLIC_ADMIN_API_TOKEN`
3. Do not commit `.env`
4. Restart Nuxt after changing `.env`

Restart local dev server:

```bash
npm run dev
```

## Admin Authentication

Admin routes require this header:

```text
Authorization: Bearer your_admin_token
```

Local example:

```text
Authorization: Bearer local_admin_test_token
```

Bad or missing token returns:

```text
403 Admin access is required.
```

## Admin Page Token Behavior

Before a valid token is submitted, the admin page shows:

1. Page title
2. Admin token input
3. Save token locally button
4. Clear token button

Before access is validated, the page hides:

1. Filters
2. Submission list
3. Submission details
4. Review actions

After a valid token is submitted, the page shows:

1. Admin access active bar
2. Clear token button
3. Filters
4. Submission list
5. Detail panel

If the token is invalid, the page shows:

```text
Admin token is missing or invalid. Check the token and try again.
```

The saved token is cleared after an auth failure.

## Admin Routes

Current protected routes:

```text
GET /api/admin/submissions
GET /api/admin/submissions/:id
POST /api/admin/submissions/:id/approve
POST /api/admin/submissions/:id/reject
```

## List All Submissions

Use this route:

```text
GET /api/admin/submissions
```

Example:

```bash
curl http://localhost:3000/api/admin/submissions \
  -H "Authorization: Bearer local_admin_test_token"
```

Expected response shape:

```json
{
  "success": true,
  "submissions": [],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "count": 0,
    "hasMore": false
  }
}
```

Returned submissions include admin only review fields.

## Pagination

The admin submissions list supports pagination.

Query parameters:

```text
limit
offset
```

Defaults:

```text
limit = 50
offset = 0
```

Maximum limit:

```text
100
```

Example:

```bash
curl "http://localhost:3000/api/admin/submissions?limit=25&offset=0" \
  -H "Authorization: Bearer local_admin_test_token"
```

Expected response includes pagination metadata:

```json
{
  "success": true,
  "submissions": [],
  "pagination": {
    "limit": 25,
    "offset": 0,
    "count": 0,
    "hasMore": false
  }
}
```

## Search Submissions

The admin submissions list supports search.

Query parameter:

```text
search
```

Search checks:

```text
riderName
nextTitle
nextClue
rejectionReason
```

Example:

```bash
curl "http://localhost:3000/api/admin/submissions?search=Nahom&limit=25&offset=0" \
  -H "Authorization: Bearer local_admin_test_token"
```

Search can be combined with status filtering:

```bash
curl "http://localhost:3000/api/admin/submissions?status=pending&search=Chicago&limit=25&offset=0" \
  -H "Authorization: Bearer local_admin_test_token"
```

Expected behavior:

1. Search is optional
2. Empty search behaves like no search
3. Search is trimmed
4. Search is limited to 100 characters
5. Search works with pagination
6. Search works with status filtering

## List Pending Submissions

Use the `status` query parameter:

```text
GET /api/admin/submissions?status=pending
```

Example:

```bash
curl "http://localhost:3000/api/admin/submissions?status=pending&limit=25&offset=0" \
  -H "Authorization: Bearer local_admin_test_token"
```

Expected behavior:

1. Returns only pending submissions
2. Returns an empty array if there are no pending submissions
3. Includes pagination metadata

## List Approved Submissions

Use:

```bash
curl "http://localhost:3000/api/admin/submissions?status=approved&limit=25&offset=0" \
  -H "Authorization: Bearer local_admin_test_token"
```

Expected behavior:

1. Returns only approved submissions
2. Includes review timestamp and reviewer when available
3. Includes pagination metadata

## List Rejected Submissions

Use:

```bash
curl "http://localhost:3000/api/admin/submissions?status=rejected&limit=25&offset=0" \
  -H "Authorization: Bearer local_admin_test_token"
```

Expected behavior:

1. Returns only rejected submissions
2. Includes rejection reason when available
3. Includes review timestamp and reviewer when available
4. Includes pagination metadata

## Invalid Status Filter

Example:

```bash
curl "http://localhost:3000/api/admin/submissions?status=banana" \
  -H "Authorization: Bearer local_admin_test_token"
```

Expected result:

```text
400 Submission status filter is invalid.
```

Valid status values:

```text
pending
approved
rejected
```

## Invalid Search Values

Search query too long example:

```bash
curl "http://localhost:3000/api/admin/submissions?search=THIS_SEARCH_QUERY_IS_TOO_LONG" \
  -H "Authorization: Bearer local_admin_test_token"
```

Expected result when the search value is longer than 100 characters:

```text
400 Search query must be 100 characters or fewer.
```

## Invalid Pagination Values

Invalid limit example:

```bash
curl "http://localhost:3000/api/admin/submissions?limit=banana" \
  -H "Authorization: Bearer local_admin_test_token"
```

Expected result:

```text
400 Limit must be a positive integer.
```

Limit too large example:

```bash
curl "http://localhost:3000/api/admin/submissions?limit=101" \
  -H "Authorization: Bearer local_admin_test_token"
```

Expected result:

```text
400 Limit must be between 1 and 100.
```

Invalid offset example:

```bash
curl "http://localhost:3000/api/admin/submissions?offset=banana" \
  -H "Authorization: Bearer local_admin_test_token"
```

Expected result:

```text
400 Offset must be a positive integer.
```

## View One Submission

Use this route:

```text
GET /api/admin/submissions/:id
```

Example:

```bash
curl http://localhost:3000/api/admin/submissions/YOUR_SUBMISSION_ID \
  -H "Authorization: Bearer local_admin_test_token"
```

Expected response shape:

```json
{
  "success": true,
  "submission": {
    "id": "YOUR_SUBMISSION_ID",
    "activeTagId": "ACTIVE_TAG_ID",
    "riderName": "Rider name",
    "foundLocationMapUrl": "Google Maps URL",
    "matchPhotoUrl": "Photo URL",
    "nextTitle": "Next tag title",
    "nextClue": "Next clue",
    "nextHiddenLocationMapUrl": "Google Maps URL",
    "nextTagPhotoUrl": "Photo URL",
    "status": "pending",
    "rejectionReason": null,
    "reviewedAt": null,
    "reviewedBy": null,
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

## Admin Page Detail Panel

When a submission is selected, the detail panel shows:

1. Submission ID
2. Active tag ID
3. Rider name
4. Next title
5. Next clue
6. Rejection reason
7. Reviewed by
8. Reviewed at
9. Found location link
10. Hidden next location link
11. Match photo link
12. Next tag photo link

The detail panel exposes admin only review data, so it must remain behind protected admin access.

## Approve A Pending Submission

Use this route:

```text
POST /api/admin/submissions/:id/approve
```

Example:

```bash
curl -X POST http://localhost:3000/api/admin/submissions/YOUR_SUBMISSION_ID/approve \
  -H "Authorization: Bearer local_admin_test_token" \
  -H "Content-Type: application/json" \
  -d '{"reviewedBy":"Nahom"}'
```

Expected response shape:

```json
{
  "success": true,
  "message": "Submission approved.",
  "submissionId": "YOUR_SUBMISSION_ID",
  "foundTagId": "FOUND_TAG_ID",
  "currentTag": {
    "id": "NEW_CURRENT_TAG_ID",
    "title": "New current tag",
    "imageUrl": "Photo URL",
    "foundBy": "Rider name",
    "createdAt": "date",
    "createdAtIso": "timestamp",
    "status": "active",
    "clueIsUnlocked": false,
    "clueUnlocksAtIso": "timestamp"
  }
}
```

Approval behavior:

1. Requires valid admin token
2. Requires `reviewedBy`
3. Requires submission status to be pending
4. Marks the previous active tag as found
5. Creates the new active tag
6. Marks the submission as approved
7. Stores reviewer and review timestamp

## Approve From The Admin Page

To approve from the admin page:

1. Open `/admin/submissions`
2. Enter a valid admin token
3. Select a pending submission
4. Review the submitted details, links, and photos
5. Click Approve submission

Expected UI behavior:

1. Success message says `Submission approved.`
2. Submission list refreshes
3. Review actions disappear for the reviewed submission
4. Current active tag changes in the public app

## Reject A Pending Submission

Use this route:

```text
POST /api/admin/submissions/:id/reject
```

Example:

```bash
curl -X POST http://localhost:3000/api/admin/submissions/YOUR_SUBMISSION_ID/reject \
  -H "Authorization: Bearer local_admin_test_token" \
  -H "Content-Type: application/json" \
  -d '{"reviewedBy":"Nahom","rejectionReason":"Testing admin rejection"}'
```

Expected response shape:

```json
{
  "success": true,
  "message": "Submission rejected.",
  "submissionId": "YOUR_SUBMISSION_ID",
  "status": "rejected"
}
```

Rejection behavior:

1. Requires valid admin token
2. Requires `reviewedBy`
3. Allows optional `rejectionReason`
4. Requires submission status to be pending
5. Marks the submission as rejected
6. Stores reviewer and review timestamp
7. Stores rejection reason when provided
8. Leaves the active tag unchanged

## Reject From The Admin Page

To reject from the admin page:

1. Open `/admin/submissions`
2. Enter a valid admin token
3. Select a pending submission
4. Review the submitted details, links, and photos
5. Add an optional rejection reason
6. Click Reject submission

Expected UI behavior:

1. Success message says `Submission rejected.`
2. Submission list refreshes
3. Review actions disappear for the reviewed submission
4. Active tag remains unchanged

## Create A Pending Submission For Testing

Set local `.env` to:

```text
NUXT_TAG_DATA_SOURCE=supabase
```

Restart Nuxt:

```bash
npm run dev
```

Open:

```text
http://localhost:3000/submit
```

Submit a tag through the app.

Expected behavior:

1. App says submission was received and is pending review
2. Current active tag does not change
3. A row is created in `public.submissions`
4. The new row has `status = pending`

Confirm in Supabase SQL Editor:

```sql
select
  id,
  status,
  created_at
from public.submissions
where status = 'pending'
order by created_at desc;
```

## Manual Approval Checklist

Before approving:

1. Confirm the submitted found location is correct
2. Confirm the matching photo is acceptable
3. Confirm the next tag photo is acceptable
4. Confirm the next title is appropriate
5. Confirm the next clue is appropriate
6. Confirm the hidden next location is valid
7. Confirm the submission is still pending

Approval command:

```bash
curl -X POST http://localhost:3000/api/admin/submissions/YOUR_SUBMISSION_ID/approve \
  -H "Authorization: Bearer local_admin_test_token" \
  -H "Content-Type: application/json" \
  -d '{"reviewedBy":"Nahom"}'
```

After approval, verify:

```sql
select
  id,
  status,
  reviewed_at,
  reviewed_by
from public.submissions
where id = 'YOUR_SUBMISSION_ID';
```

Expected:

```text
status = approved
reviewed_by is set
reviewed_at is set
```

Then verify there is one active tag:

```sql
select
  id,
  title,
  status
from public.tags
where status = 'active';
```

## Manual Rejection Checklist

Before rejecting:

1. Confirm the submission should not update the game
2. Add a clear rejection reason when useful
3. Confirm the submission is still pending

Rejection command:

```bash
curl -X POST http://localhost:3000/api/admin/submissions/YOUR_SUBMISSION_ID/reject \
  -H "Authorization: Bearer local_admin_test_token" \
  -H "Content-Type: application/json" \
  -d '{"reviewedBy":"Nahom","rejectionReason":"Reason for rejection"}'
```

After rejection, verify:

```sql
select
  id,
  status,
  rejection_reason,
  reviewed_at,
  reviewed_by
from public.submissions
where id = 'YOUR_SUBMISSION_ID';
```

Expected:

```text
status = rejected
rejection_reason is set when provided
reviewed_by is set
reviewed_at is set
```

The active tag should remain unchanged.

## Status Code Reference

### 200

Meaning:

```text
Admin token is valid and the admin action succeeded.
```

Common examples:

1. Submission list loaded
2. Submission detail loaded
3. Pending submission approved
4. Pending submission rejected

### 400

Meaning:

```text
Admin token is valid, but the request is invalid.
```

Common examples:

1. Invalid status filter
2. Invalid search query
3. Invalid limit
4. Invalid offset
5. Invalid submission id format
6. Missing `reviewedBy`
7. Rejection reason is too long

### 403

Meaning:

```text
Admin token is missing or incorrect.
```

Common fixes:

1. Check `NUXT_ADMIN_API_TOKEN` in `.env`
2. Restart Nuxt after changing `.env`
3. Confirm the request uses `Authorization: Bearer your_admin_token`
4. Confirm the header token matches `.env`

### 404

Meaning:

```text
The submission was not found.
```

Common example:

1. Valid UUID that does not match any submission

### 409

Meaning:

```text
The submission exists, but cannot be reviewed in its current state.
```

Common examples:

1. Submission is already approved
2. Submission is already rejected
3. Related active tag is no longer active

### 500

Meaning:

```text
Unexpected server or Supabase failure.
```

Common examples:

1. Missing Supabase environment value
2. Supabase permission issue
3. Unexpected response shape

## Common Errors

### Admin page does not unlock

Check:

1. `NUXT_ADMIN_API_TOKEN` is set in `.env`
2. Dev server was restarted after changing `.env`
3. Entered token exactly matches `.env`
4. Admin list route works with curl

### Admin route returns 403

Check:

1. `NUXT_ADMIN_API_TOKEN` is set in `.env`
2. Dev server was restarted after changing `.env`
3. Request includes the `Authorization` header
4. Header starts with `Bearer `
5. Header token exactly matches `.env`

### Admin route returns 400

Check:

1. `reviewedBy` is present for approve and reject
2. `reviewedBy` is not empty
3. `reviewedBy` is not too long
4. `rejectionReason` is not too long
5. Status filter is one of `pending`, `approved`, or `rejected`
6. Search query is 100 characters or fewer
7. Submission id is a valid UUID
8. Limit is between `1` and `100`
9. Offset is a positive integer or `0`

### Admin route returns 404

Check:

1. Submission id exists in `public.submissions`
2. Submission id was copied correctly

### Admin route returns 409

Check:

1. Submission is still pending
2. Submission has not already been approved
3. Submission has not already been rejected
4. Related active tag is still active

### Admin route returns 500

Check:

1. Supabase URL is configured
2. Service role key is configured
3. Service role has permission for `public.submissions`
4. Service role has permission for `public.tags`
5. Service role can execute moderation functions

## Security Notes

1. Admin routes are not public
2. Admin routes expose hidden submitted map locations
3. Admin routes expose submitted clue and photo review data
4. Admin routes must always require admin authorization
5. Admin token must stay server only
6. Do not expose admin token to browser runtime config
7. Do not commit real admin token values
8. The admin page stores the token in local browser storage
9. The admin page is only a convenience UI
10. Real protection is enforced by the server API routes

## Future Improvements

Recommended next improvements:

1. Add reviewer name input instead of hardcoding reviewer
2. Add Supabase Auth
3. Add admin role checks
4. Add rejected photo cleanup policy
5. Add better audit history
6. Add confirmation dialogs before approve and reject
7. Add image previews in the admin page