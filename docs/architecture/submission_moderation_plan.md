# Bike Tag Submission Moderation Plan

## Purpose

This document describes how Bike Tag should move from immediate public submit behavior to a safer moderated submission flow.

The current Supabase submit flow works, but it immediately changes the live game state. Before public launch, public submissions should go through review before becoming the next active tag.

## Current Submit Behavior

When `NUXT_TAG_DATA_SOURCE=supabase`, the current submit flow does this:

1. User submits the form
2. Matching photo uploads to Supabase Storage
3. Next tag photo uploads to Supabase Storage
4. API calls `public.submit_bike_tag`
5. Current active tag becomes found
6. New active tag is created
7. App immediately shows the new active tag

This is useful for testing, but risky for public launch.

## Problem

Public users can currently change live game state immediately.

Risks:

1. Incorrect found location
2. Incorrect next tag location
3. Inappropriate photo uploads
4. Spam submissions
5. Accidental bad submissions
6. Intentional game disruption
7. Active tag replaced before an admin reviews it

## Recommended Future Behavior

Public submit should create a pending submission instead of immediately replacing the active tag.

Recommended flow:

1. User submits the form
2. Photos upload to Supabase Storage
3. API creates a pending submission
4. Current active tag remains active
5. Admin reviews the submission
6. Admin approves or rejects the submission
7. Only approved submissions update the live game state

## Submit Statuses

Submissions should support these statuses:

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

## Proposed Table: submissions

Create a new table:

```text
public.submissions
```

Purpose:

1. Store public submit attempts
2. Store uploaded photo URLs
3. Store proposed next tag data
4. Support admin approval or rejection
5. Preserve audit history

## Proposed Columns

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

## Public Submit API Future Behavior

Route:

```text
POST /api/tags/submit
```

Future behavior in Supabase mode:

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

## Approval Flow

Admin approval should perform the live game handoff.

Approval behavior:

1. Load pending submission
2. Confirm submission is still pending
3. Confirm related active tag is still active
4. Mark current active tag as found
5. Create next active tag
6. Mark submission as approved
7. Store review timestamp
8. Return new current tag summary

## Rejection Flow

Admin rejection should keep the active tag unchanged.

Rejection behavior:

1. Load pending submission
2. Confirm submission is still pending
3. Mark submission as rejected
4. Store rejection reason if provided
5. Store review timestamp
6. Keep current active tag active
7. Keep uploaded photos for audit or remove them based on future policy

## Uploaded Photo Policy

Initial recommendation:

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

## Proposed Admin API Routes

Possible future routes:

```text
GET /api/admin/submissions
GET /api/admin/submissions/:id
POST /api/admin/submissions/:id/approve
POST /api/admin/submissions/:id/reject
```

These routes must not be public.

## Admin Access Protection

Before admin APIs go live, they need protection.

Possible options:

1. Simple server only admin token for early development
2. Supabase Auth
3. Role based access control
4. Protected deployment level access

Recommended long term option:

```text
Supabase Auth plus admin role checks
```

## Database Function Plan

The current function is:

```text
public.submit_bike_tag
```

This function immediately performs the game handoff.

Future plan:

1. Create `public.create_pending_submission`
2. Create `public.approve_submission`
3. Create `public.reject_submission`

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

Recommended implementation order:

1. Add moderation design doc
2. Add `submissions` table migration
3. Add pending submission database function
4. Update submit API to create pending submissions
5. Add admin approval database function
6. Add admin rejection database function
7. Add protected admin API routes
8. Add admin review UI later if needed
9. Update docs and smoke tests

## Transition Plan

During transition, keep current immediate submit behavior available only if needed for development.

Possible environment variable:

```text
NUXT_SUBMIT_REVIEW_MODE
```

Possible values:

```text
immediate
moderated
```

Recommended production value:

```text
moderated
```

Recommended local development value:

```text
moderated
```

If this flag is not added, the app should move directly to moderated submit behavior.

## Open Questions

1. Should rejected submission photos be deleted immediately?
2. Should pending submissions expire after a certain number of days?
3. Should public users receive a submission confirmation page?
4. Should admins approve through UI, API, or Supabase dashboard first?
5. Should submit require authentication before public launch?
6. Should multiple pending submissions be allowed for one active tag?
7. Should the first valid submission lock the active tag until review?
8. Should admins be able to edit submitted title or clue before approval?

## Recommended First Implementation Slice

The first code slice should be:

1. Add `public.submissions` table
2. Add constraints and indexes
3. Add service role permissions
4. Do not change current submit behavior yet

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