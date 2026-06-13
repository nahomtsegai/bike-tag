# Bike Tag Submission Moderation Plan

## Purpose

This document describes how Bike Tag moves from immediate public submit behavior to a safer moderated submission flow.

The previous Supabase submit flow worked, but it immediately changed the live game state. Before public launch, public submissions should go through review before becoming the next active tag.

## Current Moderation Status

Bike Tag now has the first complete moderation loop in place.

Implemented pieces:

1. `public.submissions` table
2. `public.create_pending_submission` database function
3. `public.approve_submission` database function
4. `public.reject_submission` database function
5. Public submit creates pending submissions in Supabase mode
6. Submit page explains that submissions require admin review
7. Submit page shows clearer field guidance for required submit fields
8. Submit page shows selected photo names and image previews
9. Submit review screen explains that submissions are not live yet
10. Submit review screen uses clearer edit and submit action labels
11. Dedicated submit confirmation page explains what happens after submission
12. Protected admin approval route
13. Protected admin rejection route
14. Admin token protection for approval and rejection
15. Admin review routes return cleaner errors for missing or already reviewed submissions
16. Rejected submission photo cleanup removes uploaded photos when possible

Current moderation behavior:

1. Public users can submit a tag
2. Supabase submit uploads photos
3. Supabase submit creates a pending submission
4. The current active tag remains active
5. Submit review screen reminds the user that admin approval is required
6. Successful submit redirects to a dedicated confirmation page
7. Confirmation page tells the user the tag is in the review queue
8. Confirmation page tells the user the current tag remains active until approval
9. Admin can approve a pending submission
10. Admin can reject a pending submission
11. Approved submissions update the live game state
12. Rejected submissions leave the active tag unchanged
13. Rejected submission photos are deleted from Supabase Storage when possible
14. Rejected submission metadata remains available for audit history
15. Fake submission ids return `404`
16. Already reviewed submissions return `409`

## Previous Submit Behavior

When `NUXT_TAG_DATA_SOURCE=supabase`, the older submit flow did this:

1. User submitted the form
2. Matching photo uploaded to Supabase Storage
3. Next tag photo uploaded to Supabase Storage
4. API called `public.submit_bike_tag`
5. Current active tag became found
6. New active tag was created
7. App immediately showed the new active tag

This was useful for testing, but risky for public launch.

## Problem

Public users should not be able to change live game state immediately.

Risks:

1. Incorrect found location
2. Incorrect next tag location
3. Inappropriate photo uploads
4. Spam submissions
5. Accidental bad submissions
6. Intentional game disruption
7. Active tag replaced before an admin reviews it
8. User confusion if the submit page implies the tag goes live immediately

## Current Submit Behavior

Public submit now creates a pending submission instead of immediately replacing the active tag.

Current flow:

1. User opens the submit page
2. Submit page explains that submitted tags require admin review
3. User fills out required find fields
4. User fills out required next tag fields
5. User selects match and next tag photos
6. Submit page shows selected photo names and previews
7. User reviews the submission
8. Review screen explains that the submission is not live yet
9. User submits the form
10. Photos upload to Supabase Storage
11. API creates a pending submission
12. User is redirected to `/submit/success`
13. Confirmation page confirms that the submission was received
14. Current active tag remains active
15. Admin reviews the submission
16. Admin approves or rejects the submission
17. Only approved submissions update the live game state

## Submit Page Guidance

The submit page is a public user facing flow.

The page should make it clear that submitting a tag does not immediately update the live game.

The submit page currently guides users through:

1. Rider name
2. Found location map link
3. Match photo
4. Optional notes
5. Next tag title
6. Hidden clue
7. Hidden next location map link
8. Next tag photo

Expected guidance behavior:

1. Rider name helper text explains that admins use the name to identify the submitter
2. Found location helper text explains that the link is used to verify the match
3. Match photo helper text explains that the photo should prove the current tag was found
4. Optional notes helper text explains that notes can help admin review
5. Next tag title helper text explains that the title should be short and friendly
6. Hidden clue helper text explains that the clue unlocks after 5 days
7. Hidden next location helper text explains that the exact location stays hidden from players
8. Next tag photo helper text explains that the photo is for the next mystery spot
9. Submit hint explains that all required fields must be filled out before review
10. Submit hint explains that the current tag does not change until admin approval

## Submit Review Screen

The submit review screen appears after the user fills out the submit form and clicks review.

Purpose:

1. Let the user confirm their submission before sending it
2. Reinforce that the submission is not live yet
3. Reinforce that admin approval is required
4. Let the user edit details before submitting
5. Let the user submit the tag for review

Expected behavior:

1. Review screen title says `Review before submitting`
2. Review screen explains that the current tag will not change until admin approval
3. Review screen shows a visible `Not live yet` reminder
4. Review screen separates the submitted find from the proposed next tag
5. Review screen labels the match photo and next tag photo
6. Review screen shows found and hidden map links
7. Review screen shows optional notes or `No notes added`
8. Edit button says `Edit submission`
9. Submit button says `Submit for review`
10. Loading submit button says `Submitting for review...`
11. User can return to editing without submitting
12. User can submit the reviewed tag into the moderation queue

## Submit Confirmation Page

After a successful public submission, the app redirects the user to a dedicated confirmation page.

Route:

```text
/submit/success
```

Purpose:

1. Confirm that the submission was received
2. Explain that the submission is in the review queue
3. Reinforce that the submission is not live yet
4. Explain that the current tag stays active until approval
5. Give the user useful next actions

Expected confirmation message:

```text
Your tag is in the review queue.
```

Expected confirmation details:

```text
Thanks for submitting a tag. An admin will review it before it becomes the current tag.
```

The confirmation page should also explain:

```text
The current tag stays active until an admin approves your submission.
```

Expected behavior:

1. Successful submit redirects to `/submit/success`
2. Submit page no longer shows an inline success card
3. Confirmation page does not imply the new tag is live
4. Confirmation page explains what happens next
5. Confirmation page links to the current tag
6. Confirmation page links to the rules
7. Confirmation page lets the user submit another tag

## Submit Page Photo Feedback

The submit page should provide immediate feedback after photo selection.

Current photo feedback:

1. Selected match photo name is shown
2. Selected next tag photo name is shown
3. Match photo preview is shown
4. Next tag photo preview is shown
5. File picker error styling appears when photo validation fails

Expected behavior:

1. Users can confirm they selected the intended match photo
2. Users can confirm they selected the intended next tag photo
3. Users can see clear validation errors for missing or invalid files
4. Users can review image previews before submitting

## Submit Page Map Link Guidance

Map links are important because admins use them to verify the found location and preserve the hidden next location.

Expected behavior:

1. Found location map link helper text explains that the link should point to the found current tag
2. Hidden next location map link helper text explains that the link should point to the exact next tag location
3. Hidden next location map link helper text explains that the location remains hidden from players
4. Map URL validation errors appear near the related field

## Submit Statuses

Submissions support these statuses:

```text
pending
approved
rejected
```

Optional future statuses:

```text
cancelled
expired
needs_review
```

## Table: submissions

The moderation table is:

```text
public.submissions
```

Purpose:

1. Store public submit attempts
2. Store uploaded photo URLs
3. Store proposed next tag data
4. Support admin approval or rejection
5. Preserve audit history

## Columns

### id

Type:

```text
uuid
```

Purpose:

1. Primary key
2. Stable submission identifier
3. Useful for admin review routes

### active_tag_id

Type:

```text
uuid
```

Purpose:

1. The active tag the user claims to have found
2. References `public.tags.id`

### rider_name

Type:

```text
text
```

Purpose:

1. Display name from submit form
2. Shows who submitted the pending tag

Rules:

1. Required
2. Trim whitespace
3. Maximum length should match submit validation

### found_location_map_url

Type:

```text
text
```

Purpose:

1. Public found location submitted by user
2. Used if submission is approved

Rules:

1. Required
2. Must be a valid Google Maps URL

### match_photo_url

Type:

```text
text
```

Purpose:

1. Proof photo URL
2. Uploaded to Supabase Storage during submit
3. Deleted when the submission is rejected if cleanup succeeds

Rules:

1. Required

### next_title

Type:

```text
text
```

Purpose:

1. Proposed title for the next active tag

Rules:

1. Required
2. Maximum length should match submit validation

### next_clue

Type:

```text
text
```

Purpose:

1. Proposed clue for the next active tag
2. Should stay hidden from public users until approved and unlocked

Rules:

1. Required
2. Maximum length should match submit validation

### next_hidden_location_map_url

Type:

```text
text
```

Purpose:

1. Proposed hidden location for the next active tag
2. Must not be exposed to public APIs

Rules:

1. Required
2. Must be a valid Google Maps URL

### next_tag_photo_url

Type:

```text
text
```

Purpose:

1. Proposed photo URL for the next active tag
2. Uploaded to Supabase Storage during submit
3. Deleted when the submission is rejected if cleanup succeeds

Rules:

1. Required

### status

Type:

```text
text
```

Purpose:

1. Tracks review state

Allowed values:

```text
pending
approved
rejected
```

### rejection_reason

Type:

```text
text
```

Purpose:

1. Optional reason for rejected submissions
2. Useful for admin audit history

### reviewed_at

Type:

```text
timestamptz
```

Purpose:

1. Timestamp for admin decision

### reviewed_by

Type:

```text
text
```

Purpose:

1. Temporary admin identifier
2. Can later become a user id after Supabase Auth is added

### created_at

Type:

```text
timestamptz
```

Purpose:

1. Timestamp for when submission was created

### updated_at

Type:

```text
timestamptz
```

Purpose:

1. Timestamp for latest submission update

## Public Submit API Behavior

Route:

```text
POST /api/tags/submit
```

Current behavior in Supabase mode:

1. Validate text fields
2. Validate Google Maps links
3. Validate image files
4. Upload photos
5. Create pending submission
6. Return a pending submission response
7. Do not mark current tag as found
8. Do not create the next active tag yet

Example response:

```json
{
  "success": true,
  "message": "Submission received and pending review.",
  "submissionId": "00000000-0000-0000-0000-000000000000",
  "status": "pending"
}
```

## Admin API Routes

Current protected moderation routes:

```text
POST /api/admin/submissions/:id/approve
POST /api/admin/submissions/:id/reject
```

These routes require an authenticated Supabase admin session. The Auth user must have a matching row in `public.admin_users`.

The access token is stored in an httpOnly, SameSite=Strict cookie scoped to `/api/admin`. Static API tokens and bearer headers are not supported.

Admin mutation requests must also pass the same-origin check.

For curl testing, first create a cookie jar:

```bash
curl -i \
  -c admin-cookies.txt \
  -X POST \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json" \
  -d '{"email":"your-admin@example.com","password":"your-admin-password"}' \
  http://localhost:3000/api/admin/session/login
```

## Approval Flow

Admin approval performs the live game handoff.

Approval route:

```text
POST /api/admin/submissions/:id/approve
```

Request body:

```json
{
  "reviewedBy": "Admin reviewer"
}
```

Approval behavior:

1. Require an authenticated Supabase admin session
2. Load pending submission
3. Confirm submission is still pending
4. Confirm related active tag is still active
5. Mark current active tag as found
6. Create next active tag
7. Mark submission as approved
8. Store review timestamp
9. Store reviewer
10. Return new current tag summary

Example curl:

```bash
curl -X POST http://localhost:3000/api/admin/submissions/YOUR_SUBMISSION_ID/approve \
  -b admin-cookies.txt \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json" \
  -d '{"reviewedBy":"Admin reviewer"}'
```

Expected success response:

```json
{
  "success": true,
  "message": "Submission approved.",
  "submissionId": "00000000-0000-0000-0000-000000000000",
  "foundTagId": "00000000-0000-0000-0000-000000000000",
  "currentTag": {
    "id": "00000000-0000-0000-0000-000000000000",
    "title": "Next active tag",
    "imageUrl": "",
    "foundBy": "Admin reviewer",
    "createdAt": "05/21/2026",
    "createdAtIso": "2026-05-21T12:00:00.000Z",
    "status": "active",
    "clueIsUnlocked": false,
    "clueUnlocksAtIso": "2026-05-26T12:00:00.000Z"
  }
}
```

## Rejection Flow

Admin rejection keeps the active tag unchanged.

Rejection route:

```text
POST /api/admin/submissions/:id/reject
```

Request body:

```json
{
  "reviewedBy": "Admin reviewer",
  "rejectionReason": "Test rejection"
}
```

Rejection behavior:

1. Require an authenticated Supabase admin session
2. Load pending submission
3. Confirm submission is still pending
4. Mark submission as rejected
5. Store rejection reason if provided
6. Store review timestamp
7. Store reviewer
8. Keep current active tag active
9. Do not create a new active tag
10. Delete rejected submission photos from Supabase Storage
11. Log cleanup failures without blocking the rejection response

Example curl:

```bash
curl -X POST http://localhost:3000/api/admin/submissions/YOUR_SUBMISSION_ID/reject \
  -b admin-cookies.txt \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json" \
  -d '{"reviewedBy":"Admin reviewer","rejectionReason":"Test rejection"}'
```

Expected success response:

```json
{
  "success": true,
  "message": "Submission rejected.",
  "submissionId": "00000000-0000-0000-0000-000000000000",
  "status": "rejected"
}
```

## Admin Status Code Expectations

Expected admin route status behavior:

```text
403 means the admin session is missing, expired, or unauthorized
400 means request body validation failed
404 means the submission does not exist
409 means the submission can no longer be reviewed
500 means an unexpected database failure happened
200 means the admin action succeeded
```

Examples:

1. Missing or unauthorized admin session returns `403`.
2. Missing `reviewedBy` returns `400`.
3. Fake submission id returns `404`.
4. Already reviewed submission returns `409`.
5. Submission connected to an inactive active tag returns `409`.
6. Authenticated admin session and valid pending submission returns `200`.

## Uploaded Photo Policy

Submission photo retention depends on review status.

Current behavior:

1. Keep photos while submissions are `pending`
2. Keep photos when submissions are `approved`
3. Delete uploaded photos when submissions are `rejected`
4. Keep rejected submission metadata
5. Keep rejection reason, reviewer, review timestamp, and status
6. Log rejected photo cleanup failures
7. Do not block the rejection decision if photo cleanup fails

Reasoning:

1. Pending submissions need photos for admin review
2. Approved submissions need photos for live game history
3. Rejected submissions should not keep unnecessary uploaded photos
4. Rejected submission metadata should remain for audit history
5. Cleanup failures should be visible to developers without breaking admin review

Rejected cleanup behavior:

1. Admin rejects the submission
2. Submission is marked rejected
3. Rejection metadata is saved
4. Match photo public URL is converted to a storage path
5. Next tag photo public URL is converted to a storage path
6. Both rejected photo paths are deleted from Supabase Storage
7. Cleanup failures are logged
8. Rejection response still succeeds if the database rejection succeeded

## Admin Interface Options

Current admin actions can be performed through:

1. The protected admin review page at `/admin/submissions`.
2. Protected admin API routes using an authenticated cookie session.
3. Supabase SQL Editor only for controlled troubleshooting or recovery work.

The admin review page includes:

1. Supabase email and password login.
2. Pending, approved, and rejected submission lists.
3. Submission detail views.
4. Approve and reject actions.
5. Reviewer and rejection-reason fields.
6. Photo and map-link previews.

## Current Admin Read Routes

Current protected read routes:

```text
GET /api/admin/submissions
GET /api/admin/submissions/:id
```

These routes require the same authenticated Supabase admin session as the moderation routes.

## Admin Access Protection

Current admin protection uses Supabase Auth plus an authorization lookup in `public.admin_users`.

After login, the server stores the Supabase access token in an httpOnly, SameSite=Strict cookie scoped to `/api/admin`.

Rules:

1. The user must successfully authenticate with Supabase Auth.
2. The Auth user must have a matching row in `public.admin_users`.
3. Admin requests use the httpOnly cookie, not a bearer header.
4. Admin mutation requests must pass the same-origin check.
5. Missing, expired, or unauthorized sessions return `403`.

## Database Function Plan

Current moderation functions:

```text
public.create_pending_submission
public.approve_submission
public.reject_submission
```

### create_pending_submission

Purpose:

1. Insert pending submission
2. Return submission id
3. Do not change active tag

### approve_submission

Purpose:

1. Validate pending submission
2. Mark active tag as found
3. Create next active tag
4. Mark submission as approved
5. Return new current tag id

### reject_submission

Purpose:

1. Validate pending submission
2. Mark submission as rejected
3. Store rejection reason
4. Do not change active tag

## Security Considerations

Moderation helps protect:

1. Game integrity
2. Public map locations
3. Uploaded photo quality
4. Active tag continuity
5. Community trust

Moderation does not replace:

1. Rate limiting
2. Image validation
3. Secret protection
4. Server side validation
5. Admin authentication

## Migration Plan

Implemented moderation pieces:

1. Add moderation design doc
2. Add `submissions` table migration
3. Add pending submission database function
4. Update submit API to create pending submissions
5. Add admin approval database function
6. Add admin rejection database function
7. Add protected admin approval route
8. Add protected admin rejection route
9. Improve public submit page guidance
10. Improve public submit review screen messaging
11. Add dedicated public submit confirmation page
12. Add cleaner admin route error handling
13. Add rejected submission photo cleanup

Future moderation pieces:

1. Update docs and smoke tests as the admin workflow matures
2. Decide whether public submit should require authentication before launch

## Transition Plan

During transition, the app has moved to moderated submit behavior in Supabase mode.

Current Supabase behavior:

```text
Public submit creates pending submission
Admin approval changes live game state
Admin rejection leaves active tag unchanged
```

Mock mode still supports local mock submit behavior.

## Open Questions

1. Should pending submissions expire after a certain number of days?
2. Should submit require authentication before public launch?
3. Should multiple pending submissions be allowed for one active tag?
4. Should the first valid submission lock the active tag until review?
5. Should admins be able to edit submitted title or clue before approval?

## Recommended Next Implementation Slice

The next code slice should be:

1. Decide whether public submit should require authentication before launch
2. Consider scheduled cleanup for old unreferenced files
3. Keep server side validation and moderation behavior unchanged

## Done Criteria

Moderation is ready when:

1. Public submit creates pending submissions
2. Public submit does not immediately change active tag
3. Submit page clearly explains that admin approval is required
4. Submit review screen clearly explains that admin approval is required
5. Submit review screen does not imply the new tag is immediately live
6. Submit confirmation page clearly explains that the submission is in review
7. Submit confirmation page does not imply the new tag is immediately live
8. Admin can approve a pending submission
9. Admin can reject a pending submission
10. Approved submission updates the live game state
11. Rejected submission does not update live game state
12. Hidden map URLs remain private
13. Submit photos remain protected according to storage policy
14. Admin routes are protected
15. Admin review routes return `404` for missing submissions
16. Admin review routes return `409` for already reviewed submissions
17. Smoke tests cover pending, approved, and rejected flows
18. Rejected submissions delete uploaded photos when possible
19. Rejected submission metadata remains available after photo cleanup

## Related Smoke Tests

Manual smoke coverage is documented in:

```text
docs/architecture/moderation_smoke_test.md
```

This checklist covers:

1. Public submit creates a pending submission
2. Admin can approve a pending submission
3. Admin can reject a pending submission
4. Approved submissions update live game state
5. Rejected submissions leave live game state unchanged
6. Rejected submission photos are deleted from Supabase Storage
7. Rejected submission metadata remains available after cleanup
8. Already reviewed submissions return `409`
9. Missing submissions return `404`
10. Missing admin session returns `403`
11. Missing reviewer returns `400`