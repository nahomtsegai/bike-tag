# Runtime Error Monitoring

## Purpose

Bike Tag reports unexpected client and server runtime failures to Sentry without adding a browser or server SDK dependency. The integration sends Sentry envelope events directly from the server and keeps the application functional when monitoring is unavailable or not configured.

This monitoring complements the existing submit diagnostics, repeated submit-failure alerts, admin audit history, Vercel logs, and hosted smoke checks. It is not a replacement for those systems.

## Captured failures

The server Nitro plugin captures unhandled errors with no HTTP status or with a status of 500 or higher.

The client plugin captures:

- top-level Vue errors
- Nuxt startup errors
- browser `error` events
- unhandled promise rejections

Expected validation, authorization, cancellation, and other 4xx errors are ignored. The client also suppresses duplicate reports with the same signature for five seconds.

## Captured context

Runtime reports are deliberately narrow. They may include:

- error type and message
- bounded stack text
- route path without query strings or fragments
- request method and status code
- request ID
- deployment environment and release
- browser user agent
- screen dimensions

The integration does not capture request bodies, form values, cookies, authorization headers, photo data, rider names, email addresses, URL query values, or arbitrary application state.

## Request IDs

Every server request receives an `x-request-id` response header. A valid incoming `x-request-id` is preserved; otherwise, the server creates a UUID.

Use the request ID to correlate:

1. the Sentry event
2. Vercel runtime logs
3. submit diagnostics
4. admin audit history
5. user-provided failure details

## Configuration

Configure the following environment variables separately in Development, Preview, and Production:

```text
NUXT_SENTRY_DSN=<project DSN>
NUXT_SENTRY_ENVIRONMENT=development|preview|production
NUXT_SENTRY_RELEASE=<git commit SHA>
```

`NUXT_SENTRY_DSN` is required for delivery. When it is absent or invalid, monitoring safely becomes a no-op.

`NUXT_SENTRY_ENVIRONMENT` falls back to `SENTRY_ENVIRONMENT`, `VERCEL_ENV`, and then `NODE_ENV`.

`NUXT_SENTRY_RELEASE` falls back to `SENTRY_RELEASE` and then `VERCEL_GIT_COMMIT_SHA`.

The public client-report endpoint is protected by the durable rate limiter. Defaults:

```text
NUXT_RUNTIME_ERROR_RATE_LIMIT_ATTEMPTS=20
NUXT_RUNTIME_ERROR_RATE_LIMIT_WINDOW_MS=600000
```

## Investigation workflow

When a new Sentry event appears:

1. Confirm the environment and release.
2. Copy the `request_id` tag when present.
3. Review the route, method, status code, and error source.
4. Search Vercel logs by request ID and deployment SHA.
5. For submission failures, compare the request ID with `/admin/errors`.
6. For admin mutations, compare the request ID with `/admin/activity`.
7. Confirm whether the failure is isolated, repeated, or tied to a deployment.
8. Record a follow-up issue before changing or retrying destructive operations.

## Verification

After adding or changing monitoring configuration:

1. Deploy to Preview.
2. Confirm ordinary navigation does not create events.
3. Trigger a controlled client error in a temporary local or Preview-only test path.
4. Trigger a controlled server error in a temporary local or Preview-only API path.
5. Confirm both events show the correct environment, release, route, and request ID.
6. Remove temporary test paths before Production promotion.
7. Confirm monitoring failures do not alter application responses.
