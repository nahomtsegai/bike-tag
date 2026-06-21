# Submission Notification Delivery

Bike Tag records each admin submission-email attempt so delivery failures can be investigated and retried without affecting the rider-facing submission result.

## Delivery lifecycle

Each new submission creates one `pending` row in `public.submission_notification_attempts` before the email provider is called. The row is then completed as either:

- `sent` when the provider request resolves successfully
- `failed` when configuration validation or the provider request throws

The submission API continues after a notification failure. Email delivery remains operationally important, but it does not roll back a valid rider submission.

## Stored fields

The history table stores:

- Submission reference
- Environment
- Attempt number
- `pending`, `sent`, or `failed` status
- Optional provider message id
- Sanitized error summary
- Retry relationship
- Start, completion, and creation timestamps

API keys, authorization headers, recipients, and full email bodies are never stored. Error messages are flattened, truncated, and scrubbed for common Resend and bearer-token patterns.

## Retry safety

Authenticated admins can retry the latest failed attempt from `/admin/notifications`.

Retries are claimed through `public.create_submission_notification_attempt`. The function uses a transaction-scoped advisory lock per submission and verifies that the requested attempt is still the latest failed attempt. This prevents concurrent or stale retries from generating duplicate email attempts.

Every retry is also recorded in the existing admin audit history with the `notification.retry` action.

## Access control

Row Level Security is enabled on `public.submission_notification_attempts`.

- `anon` has no table access
- `authenticated` has no table access
- `service_role` owns application access
- The retry-claim function is executable only by `service_role`

All history and retry endpoints require normal admin authorization.

## Failure behavior

A failure to create the initial tracking row prevents the email call and is logged by the submission diagnostics flow. A provider failure marks the attempt as failed and is rethrown to the existing notification error handler. If the failed-state update cannot be written, the original provider error is preserved and the tracking failure is logged separately.
