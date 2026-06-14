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
5. Returning stable summary counts in the admin submissions response
6. Viewing stable summary counts for pending, approved, and rejected submissions
7. Viewing summary chip skeleton loading states while counts refresh
8. Using summary status cards as quick filters
9. Viewing one submission
10. Loading fresh submission details when a submission is selected
11. Viewing inline image previews
12. Viewing status badges for pending, approved, and rejected submissions
13. Approving a pending submission
14. Rejecting a pending submission
15. Scrolling to and focusing reviewer name when it is missing
16. Signing out of the admin session
17. Opening custom confirmation modals before approve and reject actions are submitted
18. Trapping keyboard focus inside review confirmation modals
19. Locking background page scrolling while review confirmation modals are open
20. Restoring focus after review confirmation modals close
21. Using keyboard controls inside review modals

## Admin Review Page

The admin review page is available at:

```text
/admin/submissions
```

This page provides a browser based admin workflow for reviewing submissions.

The page supports:

1. Signing in with an approved Supabase admin email and password
2. Restoring an existing authenticated admin session
3. Listing submissions after access is validated
4. Loading submissions and summary counts from one admin submissions response
5. Filtering by status
6. Searching submissions
7. Paginating results
8. Viewing stable summary counts above the submission list
9. Showing skeleton placeholders inside summary chips while the response loads
10. Disabling summary chips while the response loads
11. Clicking summary status cards to filter submissions
12. Selecting a submission from the list
13. Fetching fresh details from `GET /api/admin/submissions/:id` after selection
14. Showing a selected detail refresh message while fresh details load
15. Replacing the detail panel data with the fresh detail response
16. Viewing status badges in the submission list
17. Viewing status badges in the selected submission detail panel
18. Viewing submission details
19. Viewing inline match photo and next tag photo previews
20. Clicking image previews to open full images in a new tab
21. Opening map and photo links
22. Approving pending submissions
23. Rejecting pending submissions with an optional reason
24. Showing a reviewer name error when reviewer name is missing
25. Scrolling the reviewer name section into view when reviewer name is missing
26. Focusing the reviewer name input when reviewer name is missing
27. Opening a custom confirmation modal before approval
28. Opening a custom confirmation modal before rejection
29. Trapping keyboard focus inside the confirmation modal while it is open
30. Locking background page scrolling while the confirmation modal is open
31. Restoring background page scrolling after the confirmation modal closes
32. Returning focus to the approve or reject button after the confirmation modal closes when the button still exists
33. Canceling a confirmation without calling the API
34. Closing confirmation modals with Escape
35. Confirming modal actions with Enter
36. Moving focus into the modal when it opens

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

Important:

1. Keep `NUXT_SUPABASE_SERVICE_ROLE_KEY` server only.
2. Do not commit `.env`.
3. Restart Nuxt after changing `.env`.
4. Create the admin account in Supabase Auth.
5. Add the Auth user to `public.admin_users`.

Restart the local dev server:

```bash
npm run dev
```

## Admin Photo Review URLs

The admin detail endpoint supports both legacy public photo URLs and private
pending-photo storage paths.

For path-backed private photos:

1. Admin authentication is validated before photo URLs are generated
2. The server creates a signed URL from `bike_tag_pending_photos`
3. The signed URL remains valid for 28,800 seconds, or 8 hours
4. Reloading or reopening the submission generates a fresh signed URL
5. Signed URLs are returned to the browser but are not stored in the database
6. The submission list does not generate signed URLs; they are generated only
   when an admin opens a specific submission

Legacy submissions continue using their existing public photo URLs. This
fallback remains in place during the private-storage rollout.

## Admin Authentication

Admin access uses Supabase Auth email and password authentication.

After Supabase validates the credentials, the server confirms that the Auth user has a matching row in `public.admin_users`. The access token is stored in an httpOnly, SameSite=Strict cookie scoped to `/api/admin`.

The admin API does not accept a static API token or a bearer authorization header.

Admin mutation routes require a same-origin request. Browser requests include the origin automatically. Curl examples must include:

```text
Origin: http://localhost:3000
```

Create an authenticated cookie jar for the curl examples in this guide:

```bash
curl -i \
  -c admin-cookies.txt \
  -X POST \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json" \
  -d '{"email":"your-admin@example.com","password":"your-admin-password"}' \
  http://localhost:3000/api/admin/session/login
```

Use `-b admin-cookies.txt` for protected requests.

Missing, expired, or unauthorized sessions return:

```text
403 Admin access is required.
```

## Admin Page Session Behavior

Before an authenticated session is available, the admin page shows:

1. Page title
2. Admin email input
3. Admin password input
4. Sign in button
5. Clear button

Before access is validated, the page hides:

1. Filters
2. Submission list
3. Submission details
4. Review actions

After a valid session is established, the page shows:

1. Admin session active bar
2. Sign out button
3. Reviewer name field
4. Filters
5. Submission summary counts
6. Submission list
7. Detail panel

The page checks for an existing session when it loads. Signing out clears the httpOnly cookie and returns the page to the login form.

Invalid credentials show:

```text
Invalid admin email or password.
```

## Reviewer Name Behavior

The admin page includes a reviewer name field.

The reviewer name is used as the `reviewedBy` value when approving or rejecting a submission.

Current behavior:

1. Reviewer name is required before approve or reject
2. Reviewer name does not persist after page refresh
3. Clicking into the reviewer name field and clicking away does not show an error
4. Missing reviewer name shows an error only after the admin tries to approve or reject
5. Missing reviewer name scrolls the reviewer section into view
6. Missing reviewer name focuses the reviewer name input
7. Custom confirmation modals appear only after reviewer name validation passes

If reviewer name is missing, the page shows:

```text
Reviewer name is required.
```

Expected behavior when reviewer name is missing:

1. Error message appears
2. Reviewer section scrolls into view
3. Reviewer name input receives focus
4. Confirmation modal does not open
5. API request is not sent

## Review Confirmation Modals

The admin page uses custom confirmation modals before approve and reject actions.

The confirmation modal shows:

1. Review action type
2. Submission title
3. Rider name
4. Reviewer name
5. Cancel button
6. Confirm action button

Expected behavior:

1. Reviewer name validation happens before the modal opens
2. Missing reviewer name does not open the modal
3. Missing reviewer name scrolls to and focuses the reviewer name input
4. Focus moves into the modal when it opens
5. Tab keeps focus inside the modal
6. Shift plus Tab keeps focus inside the modal
7. Background page scrolling is locked while the modal is open
8. Background page scrolling is restored after the modal closes
9. Closing the modal returns focus to the button that opened it when the button still exists
10. Escape closes the modal and does not call the API
11. Enter confirms the modal action
12. Cancel closes the modal and does not call the API
13. Confirm calls the approve or reject API
14. The modal closes after a successful action
15. Success and error messages still appear in the admin page

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
  -b admin-cookies.txt
```

Expected response shape:

```json
{
  "success": true,
  "submissions": [],
  "summary": {
    "pending": 0,
    "approved": 0,
    "rejected": 0
  },
  "pagination": {
    "limit": 50,
    "offset": 0,
    "count": 0,
    "hasMore": false
  }
}
```

Returned submissions include admin only review fields.

## Verify Admin Submission Summary Response

The admin submissions list response includes a `summary` object.

This summary allows the admin page to show pending, approved, and rejected counts without making separate requests for each status.

Example:

```bash
curl "http://localhost:3000/api/admin/submissions?limit=25&offset=0" \
  -b admin-cookies.txt
```

Expected response shape:

```json
{
  "success": true,
  "submissions": [],
  "summary": {
    "pending": 0,
    "approved": 0,
    "rejected": 0
  },
  "pagination": {
    "limit": 25,
    "offset": 0,
    "count": 0,
    "hasMore": false
  }
}
```

Expected behavior:

1. `summary.pending` is always present
2. `summary.approved` is always present
3. `summary.rejected` is always present
4. Summary counts are numbers
5. Summary counts are not limited by the selected status filter
6. Summary counts are not limited by pagination
7. Summary counts respect the current search query
8. The response still includes `submissions`
9. The response still includes `pagination`

Manual checks:

1. Call the route with no status filter
2. Confirm `summary` exists
3. Call the route with `status=pending`
4. Confirm `summary.approved` and `summary.rejected` still exist
5. Call the route with `search=some-value`
6. Confirm summary counts update based on that search
7. Confirm the browser Network tab shows one admin submissions request per list refresh

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
  -b admin-cookies.txt
```

Expected response includes summary and pagination metadata:

```json
{
  "success": true,
  "submissions": [],
  "summary": {
    "pending": 0,
    "approved": 0,
    "rejected": 0
  },
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
curl "http://localhost:3000/api/admin/submissions?search=Test&limit=25&offset=0" \
  -b admin-cookies.txt
```

Search can be combined with status filtering:

```bash
curl "http://localhost:3000/api/admin/submissions?status=pending&search=Park&limit=25&offset=0" \
  -b admin-cookies.txt
```

Expected behavior:

1. Search is optional
2. Empty search behaves like no search
3. Search is trimmed
4. Search is limited to 100 characters
5. Search works with pagination
6. Search works with status filtering
7. Summary counts update based on the current search value
8. Summary counts are returned in the same response as the submission list

## List Pending Submissions

Use the `status` query parameter:

```text
GET /api/admin/submissions?status=pending
```

Example:

```bash
curl "http://localhost:3000/api/admin/submissions?status=pending&limit=25&offset=0" \
  -b admin-cookies.txt
```

Expected behavior:

1. Returns only pending submissions
2. Returns an empty array if there are no pending submissions
3. Includes summary metadata
4. Includes pagination metadata

## List Approved Submissions

Use:

```bash
curl "http://localhost:3000/api/admin/submissions?status=approved&limit=25&offset=0" \
  -b admin-cookies.txt
```

Expected behavior:

1. Returns only approved submissions
2. Includes review timestamp and reviewer when available
3. Includes summary metadata
4. Includes pagination metadata

## List Rejected Submissions

Use:

```bash
curl "http://localhost:3000/api/admin/submissions?status=rejected&limit=25&offset=0" \
  -b admin-cookies.txt
```

Expected behavior:

1. Returns only rejected submissions
2. Includes rejection reason when available
3. Includes review timestamp and reviewer when available
4. Includes summary metadata
5. Includes pagination metadata

## Invalid Status Filter

Example:

```bash
curl "http://localhost:3000/api/admin/submissions?status=banana" \
  -b admin-cookies.txt
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
  -b admin-cookies.txt
```

Expected result when the search value is longer than 100 characters:

```text
400 Search query must be 100 characters or fewer.
```

## Invalid Pagination Values

Invalid limit example:

```bash
curl "http://localhost:3000/api/admin/submissions?limit=banana" \
  -b admin-cookies.txt
```

Expected result:

```text
400 Limit must be a positive integer.
```

Limit too large example:

```bash
curl "http://localhost:3000/api/admin/submissions?limit=101" \
  -b admin-cookies.txt
```

Expected result:

```text
400 Limit must be between 1 and 100.
```

Invalid offset example:

```bash
curl "http://localhost:3000/api/admin/submissions?offset=banana" \
  -b admin-cookies.txt
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
  -b admin-cookies.txt
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

## Admin Page Selected Submission Detail Refresh

When a reviewer selects a submission from the list, the admin page immediately shows that list item in the detail panel.

Then the page fetches the latest detail record from:

```text
GET /api/admin/submissions/:id
```

Expected behavior:

1. Clicking a submission immediately selects it in the list
2. The detail panel immediately shows the selected list item
3. The page requests fresh details from `GET /api/admin/submissions/:id`
4. The detail panel shows `Refreshing selected submission details...` while the request is active
5. The selected submission is replaced with the fresh detail response
6. If the detail request fails, the existing selected list item remains visible
7. If the selected submission changes before the detail request finishes, the older response is ignored
8. Approving or rejecting a submission refreshes the list
9. Approving or rejecting a submission refreshes the selected detail when the reviewed submission is still visible

Manual checks:

1. Open `/admin/submissions`
2. Select a pending submission
3. Confirm the detail panel updates immediately
4. Confirm the refresh message appears briefly
5. Confirm the Network tab shows `GET /api/admin/submissions/:id`
6. Select another submission quickly
7. Confirm the detail panel does not get overwritten by the earlier request
8. Approve or reject a submission
9. Confirm the selected detail updates after the action completes

## Admin Page Summary Counts

The admin page shows summary cards above the submission list.

Current summary cards:

```text
Pending
Approved
Rejected
```

Expected behavior:

1. Counts are returned from `GET /api/admin/submissions`
2. Counts are based on matching submissions for each status
3. Counts are not limited by the selected status filter
4. Counts are not limited by the current pagination page
5. Counts update after applying search
6. Counts update after approve and reject actions refresh the list
7. Counts show skeleton placeholders while the admin submissions response loads
8. Summary cards are disabled while the admin submissions response loads
9. Pending, approved, and rejected summary cards can be clicked as quick filters
10. Clicking a status summary card updates the status filter
11. Clicking a summary filter card resets pagination to the first page
12. Clicking a summary filter card reloads the submission list
13. The selected summary filter card is visually highlighted

The pending, approved, and rejected cards are filter controls.

The summary cards are meant to help reviewers quickly understand and navigate the review queue. The counts remain visible for all three statuses, even when one status filter is selected.

## Admin Page Submission List

The submission list shows each submission with:

1. Next tag title
2. Rider name
3. Created timestamp
4. Status badge

Status badges make the moderation queue easier to scan.

Current badge states:

```text
Pending
Approved
Rejected
```

Expected behavior:

1. Pending submissions show a pending badge
2. Approved submissions show an approved badge
3. Rejected submissions show a rejected badge
4. Filtering still works with the same status values
5. Selecting a submission still opens the detail panel
6. Selecting a submission loads fresh detail by ID

## Admin Page Detail Panel

When a submission is selected, the detail panel shows:

1. Submission status badge
2. Submission ID
3. Active tag ID
4. Rider name
5. Next title
6. Next clue
7. Rejection reason
8. Reviewed by
9. Reviewed at
10. Match photo preview
11. Next tag photo preview
12. Clickable image previews that open full images in a new tab
13. Found location link
14. Hidden next location link
15. Match photo link
16. Next tag photo link

Image previews are shown inline to make review faster. Clicking a preview opens the full image in a new tab. The existing photo links remain available below the previews.

If an image preview fails to load, the admin page shows a fallback message instead of a broken image icon. The reviewer can still use the photo link below the preview area to open the submitted photo in a new tab.

The detail panel exposes admin only review data, so it must remain behind protected admin access.

## Approve A Pending Submission

Use this route:

```text
POST /api/admin/submissions/:id/approve
```

Example:

```bash
curl -X POST http://localhost:3000/api/admin/submissions/YOUR_SUBMISSION_ID/approve \
  -b admin-cookies.txt \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json" \
  -d '{"reviewedBy":"Admin reviewer"}'
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

1. Requires an authenticated Supabase admin session
2. Requires `reviewedBy`
3. Requires submission status to be pending
4. Marks the previous active tag as found
5. Creates the new active tag
6. Marks the submission as approved
7. Stores reviewer and review timestamp

## Approve From The Admin Page

To approve from the admin page:

1. Open `/admin/submissions`
2. Sign in with an approved Supabase admin email and password
3. Enter reviewer name
4. Select a pending submission
5. Review the submitted details, status badge, image previews, links, and photos
6. Click Approve submission
7. Confirm the approval in the custom modal

Expected UI behavior:

1. Missing reviewer name shows `Reviewer name is required.`
2. Missing reviewer name scrolls the reviewer section into view
3. Missing reviewer name focuses the reviewer name input
4. The custom confirmation modal appears only after reviewer name validation passes
5. Focus moves into the confirmation modal when it opens
6. Focus remains inside the confirmation modal while it is open
7. Background page scrolling is locked while the modal is open
8. Background page scrolling is restored after the modal closes
9. Closing the modal returns focus to Approve submission when the button still exists
10. The modal shows submission title, rider name, and reviewer name
11. Escape closes the modal and does not call the API
12. Enter confirms approval
13. Canceling the confirmation does not call the API
14. Confirming approval calls the approve API
15. Success message says `Submission approved.`
16. Submission list refreshes
17. Summary counts refresh from the admin submissions response
18. Review actions disappear for the reviewed submission
19. Submission status changes to approved
20. Approved status badge appears for the reviewed submission
21. Selected detail refreshes from `GET /api/admin/submissions/:id`
22. Current active tag changes in the public app

## Reject A Pending Submission

Use this route:

```text
POST /api/admin/submissions/:id/reject
```

Example:

```bash
curl -X POST http://localhost:3000/api/admin/submissions/YOUR_SUBMISSION_ID/reject \
  -b admin-cookies.txt \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json" \
  -d '{"reviewedBy":"Admin reviewer","rejectionReason":"Testing admin rejection"}'
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

1. Requires an authenticated Supabase admin session
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
2. Sign in with an approved Supabase admin email and password
3. Enter reviewer name
4. Select a pending submission
5. Review the submitted details, status badge, image previews, links, and photos
6. Add an optional rejection reason
7. Click Reject submission
8. Confirm the rejection in the custom modal

Expected UI behavior:

1. Missing reviewer name shows `Reviewer name is required.`
2. Missing reviewer name scrolls the reviewer section into view
3. Missing reviewer name focuses the reviewer name input
4. The custom confirmation modal appears only after reviewer name validation passes
5. Focus moves into the confirmation modal when it opens
6. Focus remains inside the confirmation modal while it is open
7. Background page scrolling is locked while the modal is open
8. Background page scrolling is restored after the modal closes
9. Closing the modal returns focus to Reject submission when the button still exists
10. The modal shows submission title, rider name, and reviewer name
11. Escape closes the modal and does not call the API
12. Enter confirms rejection
13. Canceling the confirmation does not call the API
14. Confirming rejection calls the reject API
15. Success message says `Submission rejected.`
16. Submission list refreshes
17. Summary counts refresh from the admin submissions response
18. Review actions disappear for the reviewed submission
19. Submission status changes to rejected
20. Rejected status badge appears for the reviewed submission
21. Selected detail refreshes from `GET /api/admin/submissions/:id`
22. Active tag remains unchanged

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
  -b admin-cookies.txt \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json" \
  -d '{"reviewedBy":"Admin reviewer"}'
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
  -b admin-cookies.txt \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json" \
  -d '{"reviewedBy":"Admin reviewer","rejectionReason":"Reason for rejection"}'
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
The Supabase admin session is valid and the admin action succeeded.
```

Common examples:

1. Submission list loaded
2. Submission detail loaded
3. Pending submission approved
4. Pending submission rejected

### 400

Meaning:

```text
The Supabase admin session is valid, but the request is invalid.
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
The admin session is missing, expired, or not authorized.
```

Common fixes:

1. Confirm the admin account exists in Supabase Auth.
2. Confirm the Auth user has a matching row in `public.admin_users`.
3. Sign in again to create a fresh admin session.
4. For curl, confirm the login request created `admin-cookies.txt`.
5. For curl, send `-b admin-cookies.txt` with protected requests.
6. Include the matching `Origin` header on mutation requests.

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

1. The Supabase URL and anon key are configured.
2. The admin account exists in Supabase Auth.
3. The Auth user has a matching row in `public.admin_users`.
4. The password is correct.
5. The dev server was restarted after changing `.env`.
6. The browser allows the admin session cookie.

### Reviewer name required

The admin page requires reviewer name before approve or reject.

Expected behavior:

1. Clicking into the reviewer field and clicking away does not show an error.
2. Clicking approve or reject without reviewer name shows `Reviewer name is required.`
3. Missing reviewer name scrolls the reviewer section into view.
4. Missing reviewer name focuses the reviewer name input.
5. Confirmation modal does not appear when reviewer name is missing.

### Admin route returns 403

Check:

1. The admin account exists in Supabase Auth.
2. The Auth user has a matching row in `public.admin_users`.
3. The admin session has not expired.
4. Curl requests use `-b admin-cookies.txt`.
5. Mutation requests include `Origin: http://localhost:3000`.
6. The cookie jar was created by a successful login request.

### Admin route returns 400

Check:

1. `reviewedBy` is present for approve and reject.
2. `reviewedBy` is not empty.
3. `reviewedBy` is not too long.
4. `rejectionReason` is not too long.
5. Status filter is one of `pending`, `approved`, or `rejected`.
6. Search query is 100 characters or fewer.
7. Submission id is a valid UUID.
8. Limit is between `1` and `100`.
9. Offset is a positive integer or `0`.

### Admin route returns 404

Check:

1. Submission id exists in `public.submissions`.
2. Submission id was copied correctly.

### Admin route returns 409

Check:

1. Submission is still pending.
2. Submission has not already been approved.
3. Submission has not already been rejected.
4. Related active tag is still active.

### Admin route returns 500

Check:

1. Supabase URL is configured.
2. Service role key is configured.
3. Service role has permission for `public.submissions`.
4. Service role has permission for `public.tags`.
5. Service role can execute moderation functions.

## Security Notes

1. Admin data and moderation routes are not public.
2. Admin routes expose hidden submitted map locations.
3. Admin routes expose submitted clue and photo review data.
4. Admin routes require a valid Supabase Auth session.
5. The Auth user must have a matching row in `public.admin_users`.
6. The access token is stored in an httpOnly, SameSite=Strict cookie scoped to `/api/admin`.
7. Admin mutation routes require same-origin requests.
8. Static API-token and bearer-header authentication are not supported.
9. Admin login attempts use durable Supabase/Postgres rate limiting.
10. The admin page is a convenience UI; authorization is enforced by server API routes.

## Future Improvements

Recommended next improvements:

1. Add multiple admin roles if different permission levels become necessary.
2. Add stronger admin audit logging.
3. Add better audit history.
