# Bike Tag Moderation Smoke Test

## Purpose

This checklist verifies that the moderated submission flow works from public submit through admin approval and rejection.

Use this checklist before changing moderation, submit, admin review, storage, or Supabase database behavior.

## Scope

This smoke test covers:

1. Public submit creates a pending submission
2. Public submit does not immediately change the current tag
3. Admin can view pending submissions
4. Admin can approve a pending submission
5. Admin can reject a pending submission
6. Approved submissions update the live game state
7. Rejected submissions leave the live game state unchanged
8. Admin review errors return expected status codes

## Required Local Setup

Confirm local environment values are configured:

```text
NUXT_TAG_DATA_SOURCE=supabase
NUXT_PUBLIC_SUPABASE_URL=your-supabase-url
NUXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
NUXT_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NUXT_ADMIN_API_TOKEN=local-admin-test-token
```

Start the app:

```bash
npm run dev
```

Open the app:

```text
http://localhost:3000
```

## Preflight Checks

Before testing, confirm:

1. Supabase migrations have been applied
2. Storage buckets are configured
3. There is one active tag
4. Admin token is available locally
5. App is running in Supabase mode
6. Browser console has no startup errors

## Test Data To Prepare

Prepare two different public submissions:

1. One submission to approve
2. One submission to reject

Use different next tag titles so the submissions are easy to identify in the admin page.

Example titles:

```text
Smoke approval tag
Smoke rejection tag
```

## Smoke Test 1: Public Submit Creates Pending Submission

### Steps

1. Open `/submit`
2. Fill out all required fields
3. Add a match photo
4. Add a next tag photo
5. Click `Review tag`
6. Confirm the review screen says the submission is not live yet
7. Click `Submit for review`

### Expected Result

1. User is redirected to `/submit/success`
2. Confirmation page says the tag is in the review queue
3. Confirmation page says the current tag stays active until approval
4. Current active tag does not change immediately
5. A new pending submission exists for admin review

## Smoke Test 2: Admin Can View Pending Submissions

### Steps

1. Open the admin submissions page
2. Enter the local admin token if needed
3. Load submissions
4. Select the pending submission created in Smoke Test 1

### Expected Result

1. Pending submission appears in the list
2. Summary counts load
3. Detail panel loads the selected submission
4. Match photo is visible
5. Next tag photo is visible
6. Found map link opens in a new tab
7. Hidden map link opens in a new tab
8. Submission status is `pending`

## Smoke Test 3: Admin Approval Updates Live Game State

### Steps

1. Select the pending submission intended for approval
2. Enter reviewer name
3. Click `Approve submission`
4. Confirm the approval modal
5. Wait for the request to finish
6. Open `/current-tag`

### Expected Result

1. Approval succeeds
2. Submission status changes to `approved`
3. Previous active tag is marked found
4. Approved next tag becomes the current active tag
5. Current tag page shows the approved next tag
6. Clue remains locked until its unlock date
7. Hidden location is not exposed publicly

## Smoke Test 4: Admin Rejection Leaves Live Game State Unchanged

### Steps

1. Create another public submission
2. Open the admin submissions page
3. Select the new pending submission
4. Enter reviewer name
5. Add a rejection reason
6. Click `Reject submission`
7. Confirm the rejection modal
8. Open `/current-tag`

### Expected Result

1. Rejection succeeds
2. Submission status changes to `rejected`
3. Rejection reason is saved
4. Current active tag stays unchanged
5. No new active tag is created from the rejected submission

## Smoke Test 5: Already Reviewed Submission Returns 409

### Steps

1. Use a submission that was already approved or rejected
2. Send another approve or reject request for the same submission id

Example approve request:

```bash
curl -X POST http://localhost:3000/api/admin/submissions/YOUR_SUBMISSION_ID/approve \
  -H "Authorization: Bearer local-admin-test-token" \
  -H "Content-Type: application/json" \
  -d '{"reviewedBy":"Admin reviewer"}'
```

Example reject request:

```bash
curl -X POST http://localhost:3000/api/admin/submissions/YOUR_SUBMISSION_ID/reject \
  -H "Authorization: Bearer local-admin-test-token" \
  -H "Content-Type: application/json" \
  -d '{"reviewedBy":"Admin reviewer","rejectionReason":"Smoke test rejection"}'
```

### Expected Result

1. API returns `409`
2. Error message says the submission has already been reviewed
3. Live game state does not change

## Smoke Test 6: Missing Submission Returns 404

### Steps

1. Use a valid UUID that does not exist in `public.submissions`
2. Send an approve request

Example request:

```bash
curl -X POST http://localhost:3000/api/admin/submissions/00000000-0000-0000-0000-000000000000/approve \
  -H "Authorization: Bearer local-admin-test-token" \
  -H "Content-Type: application/json" \
  -d '{"reviewedBy":"Admin reviewer"}'
```

### Expected Result

1. API returns `404`
2. Error message says the submission was not found
3. Live game state does not change

## Smoke Test 7: Missing Admin Token Returns 403

### Steps

1. Send an approve request without the admin token

Example request:

```bash
curl -X POST http://localhost:3000/api/admin/submissions/YOUR_SUBMISSION_ID/approve \
  -H "Content-Type: application/json" \
  -d '{"reviewedBy":"Admin reviewer"}'
```

### Expected Result

1. API returns `403`
2. Submission remains unchanged
3. Live game state does not change

## Smoke Test 8: Missing Reviewer Returns 400

### Steps

1. Send an approve request with an empty body

Example request:

```bash
curl -X POST http://localhost:3000/api/admin/submissions/YOUR_SUBMISSION_ID/approve \
  -H "Authorization: Bearer local-admin-test-token" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Expected Result

1. API returns `400`
2. Error message says reviewer is required
3. Submission remains unchanged
4. Live game state does not change

## Final Verification Checklist

After all smoke tests, confirm:

1. Approved submission is listed as `approved`
2. Rejected submission is listed as `rejected`
3. At least one pending submission can still be created
4. Current tag page shows the expected active tag
5. Tags history shows the approved found tag correctly
6. Hidden map URLs are not exposed on public pages
7. Browser console has no unexpected errors
8. Server terminal has no unexpected errors

## Notes

This is a manual smoke checklist. It should eventually be replaced or supported by automated API and browser tests.