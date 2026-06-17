# Active Tag Submission Binding

## Purpose

Every public submission is bound to the active tag that the rider saw when the submit page loaded. This prevents a delayed submission for an older tag from being attached to a newer active tag.

## Request flow

1. The submit page loads the current tag through the `submit-current-tag` Nuxt data key.
2. The browser sends that tag ID in the `x-bike-tag-expected-active-tag-id` request header.
3. The server validates the ID as a UUID.
4. The `create_tag_bound_idempotent_private_pending_submission` database function locks the current active tag and compares its ID with the expected ID.
5. Matching IDs create or return the idempotent pending submission.
6. A mismatch raises `ACTIVE_TAG_CHANGED`, which the API maps to HTTP `409`.
7. Uploaded photos from a rejected stale request are handled by the existing failed-submit cleanup path.

## Idempotent retries

A retry with the same client submission ID returns the existing submission when its stored `active_tag_id` matches the expected tag ID. Reusing the same client submission ID with a different expected tag raises `IDEMPOTENT_SUBMISSION_TAG_MISMATCH`.

## Deployment order

Apply migration `20260617150000_bind_submissions_to_expected_active_tag.sql` to the target Supabase project before deploying the application code that calls the new RPC. Hosted migration parity should pass before promotion.

## Verification

Automated coverage includes:

- client request-header behavior
- server RPC argument and error mapping
- database creation and idempotent retry behavior
- stale active-tag rejection
- service-role-only function execution
