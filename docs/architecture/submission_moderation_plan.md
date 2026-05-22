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
6. Protected admin approval route
7. Protected admin rejection route
8. Admin token protection for approval and rejection

Current moderation behavior:

1. Public users can submit a tag
2. Supabase submit uploads photos
3. Supabase submit creates a pending submission
4. The current active tag remains active
5. Admin can approve a pending submission
6. Admin can reject a pending submission
7. Approved submissions update the live game state
8. Rejected submissions leave the active tag unchanged

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

## Current Submit Behavior

Public submit now creates a pending submission instead of immediately replacing the active tag.

Current flow:

1. User submits the form
2. Photos upload to Supabase Storage
3. API creates a pending submission
4. Current active tag remains active
5. Admin reviews the submission
6. Admin approves or rejects the submission
7. Only approved submissions update the live game state

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

Current protected admin routes:

```text
POST /api/admin/submissions/:id/approve
POST /api/admin/submissions/:id/reject
```

These routes require an admin token.

Admin requests should include:

```text
Authorization: Bearer your_admin_token
```

The admin token is configured with:

```text
NUXT_ADMIN_API_TOKEN
```

This token must stay server only.

## Approval Flow

Admin approval performs the live game handoff.

Approval route:

```text
POST /api/admin/submissions/:id/approve
```

Request body:

```json
{
  "reviewedBy": "Nahom"
}
```

Approval behavior:

1. Require valid admin token
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
  -H "Authorization: Bearer local-admin-test-token" \
  -H "Content-Type: application/json" \
  -d '{"reviewedBy":"Nahom"}'
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
    "foundBy": "Nahom",
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
  "reviewedBy": "Nahom",
  "rejectionReason": "Test rejection"
}
```

Rejection behavior:

1. Require valid admin token
2. Load pending submission
3. Confirm submission is still pending
4. Mark submission as rejected
5. Store rejection reason if provided
6. Store review timestamp
7. Store reviewer
8. Keep current active tag active
9. Do not create a new active tag

Example curl:

```bash
curl -X POST http://localhost:3000/api/admin/submissions/YOUR_SUBMISSION_ID/reject \
  -H "Authorization: Bearer local-admin-test-token" \
  -H "Content-Type: application/json" \
  -d '{"reviewedBy":"Nahom","rejectionReason":"Test rejection"}'
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
403 means admin token failed
400 means request body validation failed
500 means database approval or rejection failed
200 means the admin action succeeded
```

Examples:

1. Wrong or missing admin token returns `403`
2. Missing `reviewedBy` returns `400`
3. Fake submission id or already reviewed submission currently returns `500`
4. Valid token and valid pending submission returns `200`

Future improvement:

1. Return `404` when the submission does not exist
2. Return `409` when the submission is not pending
3. Return cleaner error messages for already approved or rejected submissions

## Uploaded Photo Policy

Current recommendation:

1. Keep photos for pending submissions
2. Keep photos for approved submissions
3. Decide whether rejected submission photos should be deleted or retained
4. Add cleanup behavior later if rejected photos should be removed

Future option:

1. Delete rejected submission photos
2. Keep only metadata and rejection reason
3. Log deletion failures

## Admin Interface Options

Initial admin action can be done through:

1. Protected API route
2. CLI command
3. Supabase SQL Editor during early testing

Future admin UI could include:

1. Pending submissions list
2. Submission detail page
3. Approve button
4. Reject button
5. Rejection reason field
6. Photo preview
7. Map link preview

## Future Admin API Routes

Possible future routes:

```text
GET /api/admin/submissions
GET /api/admin/submissions/:id
```

These routes must not be public.

## Admin Access Protection

Current admin protection uses:

```text
NUXT_ADMIN_API_TOKEN
```

Requests must send:

```text
Authorization: Bearer your_admin_token
```

This is useful for early development and manual testing.

Recommended long term option:

```text
Supabase Auth plus admin role checks
```

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

Future moderation pieces:

1. Add admin list route
2. Add admin detail route
3. Add admin review UI or CLI
4. Add cleaner admin route error handling
5. Update docs and smoke tests as the admin workflow matures

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

1. Should rejected submission photos be deleted immediately?
2. Should pending submissions expire after a certain number of days?
3. Should public users receive a submission confirmation page?
4. Should admins approve through UI, API, or Supabase dashboard first?
5. Should submit require authentication before public launch?
6. Should multiple pending submissions be allowed for one active tag?
7. Should the first valid submission lock the active tag until review?
8. Should admins be able to edit submitted title or clue before approval?
9. Should admin token auth be replaced before public launch?
10. Should already reviewed submissions return `409` instead of `500`?

## Recommended Next Implementation Slice

The next code slice should be:

1. Improve admin route error handling
2. Return cleaner status codes for not found and not pending submissions
3. Keep admin token protection in place

## Done Criteria

Moderation is ready when:

1. Public submit creates pending submissions
2. Public submit does not immediately change active tag
3. Admin can approve a pending submission
4. Admin can reject a pending submission
5. Approved submission updates the live game state
6. Rejected submission does not update live game state
7. Hidden map URLs remain private
8. Submit photos remain protected according to storage policy
9. Admin routes are protected
10. Smoke tests cover pending, approved, and rejected flows