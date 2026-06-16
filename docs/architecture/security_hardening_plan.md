# Bike Tag Security Hardening Plan

## Purpose

This document tracks the current security posture for Bike Tag and the next security improvements needed before public launch.

Bike Tag now supports real Supabase reads, photo uploads, moderated submissions, and protected admin approval or rejection.

Because public users can submit files and propose game state changes, security needs to stay ahead of new features.

## Current Security Goals

The app should protect:

1. Supabase service role key
2. Admin API token
3. Hidden active tag location
4. Hidden active tag clue before unlock
5. Uploaded photos
6. Submit API
7. Admin approval and rejection routes
8. Reset behavior
9. Internal system status
10. Public user experience
11. Game integrity

## Public Pages

These pages are intended to be public:

```text
/current-tag
/tags
/map
/rules
/submit
/settings
```

The public Settings page should only include user safe preferences.

Current public Settings behavior:

1. Theme preference is visible
2. Internal data source details are hidden
3. Submit mode details are hidden
4. Reset mock game data is hidden
5. Supabase configuration status is hidden

## Public APIs

These APIs are intended to be public:

```text
GET /api/tags/current
GET /api/tags
GET /api/tags/:id
POST /api/tags/submit
```

Public APIs must not expose:

1. Supabase service role key
2. Admin API token
3. Hidden active map URL
4. Locked clue before unlock time
5. Private backend configuration
6. Admin only data

## Development Only APIs

These APIs are development only:

```text
GET /api/system/data-source
POST /api/tags/reset
```

Current behavior:

1. System data source status is blocked outside development
2. Reset is blocked outside development
3. Reset is blocked when the tag data source is Supabase
4. Reset is only allowed in development mock mode

## Protected Admin APIs

Admin data and mutation APIs are protected by Supabase Auth and the `public.admin_users` authorization table.

Protected routes include:

```text
GET /api/admin/submissions
GET /api/admin/submissions/:id
POST /api/admin/submissions/:id/approve
POST /api/admin/submissions/:id/reject
POST /api/admin/submissions/:id/archive
POST /api/admin/submissions/:id/delete
GET /api/admin/errors
POST /api/admin/tags/opening
POST /api/admin/cleanup/delete-game-data
```

Authentication flow:

1. Admin signs in with Supabase email and password.
2. The server confirms the Auth user has a matching row in `public.admin_users`.
3. The Supabase access token is stored in an httpOnly, SameSite=Strict cookie scoped to `/api/admin`.
4. Protected routes validate that cookie on the server.
5. Admin mutation routes also enforce same-origin requests.
6. Missing, expired, or unauthorized sessions return `403`.

Static API tokens and bearer-header authentication are not supported.

## Server Only Secrets

The Supabase service role key must only be used on the server.

Environment variable:

```text
NUXT_SUPABASE_SERVICE_ROLE_KEY
```

Rules:

1. Never expose it through public runtime config.
2. Never send it to browser code.
3. Never return it from an API response.
4. Never commit it to Git.
5. Keep it in local `.env` and deployment secret settings only.

The public Supabase anon key may be exposed to the browser, but it must never be treated as an admin credential. Admin authorization is enforced by Supabase Auth, the server-side `public.admin_users` check, and protected server routes.

## Data Source Control

The active tag data source is controlled by:

```text
NUXT_TAG_DATA_SOURCE
```

Supported values:

```text
mock
supabase
```

Rules:

1. Public users cannot change this value
2. The value should be controlled by deployment configuration
3. Mock mode is useful for local development
4. Supabase mode is used for real backend reads and moderated submits

## Submit API Protection

The submit API is the highest risk public endpoint because it can:

1. Upload photos
2. Write to Supabase Storage
3. Create pending submissions
4. Propose a found tag
5. Propose the next active tag

Current protections:

1. Required text validation
2. Google Maps link validation
3. Required image validation
4. Image MIME type validation
5. Image extension validation
6. MIME type and extension pairing validation
7. Image size validation
8. Durable submit rate limiting
9. Vercel BotID verification on deployed submit requests
10. Failed upload cleanup
11. Supabase submit runs through server routes only
12. Supabase submit creates pending submissions instead of immediately changing live game state

## Moderation Protection

Bike Tag now has a basic moderation loop.

Current behavior:

1. Public submit creates a pending submission
2. Public submit does not immediately mark the active tag as found
3. Public submit does not immediately create the next active tag
4. Admin approval requires an authenticated and authorized Supabase admin session
5. Admin rejection requires an authenticated and authorized Supabase admin session
6. Approved submissions update live game state
7. Rejected submissions leave the active tag unchanged
8. Rejected submission photos are deleted from Supabase Storage when possible
9. Rejected submission metadata remains available for audit history

Moderation protects against:

1. Bad submitted photos
2. Wrong found locations
3. Wrong hidden next tag locations
4. Spam submissions changing the live game
5. Accidental bad submissions
6. Intentional game disruption

Current limitations:

1. Admin access currently has one authorization level; role tiers are not implemented.
2. Scheduled cleanup for old unreferenced storage files is planned but not implemented.

Future improvements:

1. Add admin role tiers only if different permission levels become necessary.
2. Add scheduled cleanup dry run for old unreferenced storage files.
3. Add scheduled cleanup deletion mode after dry run verification.
4. Add structured cleanup failure logging.

## Durable Rate Limiting

Bike Tag uses a durable Supabase/Postgres rate limiter for public submissions,
submit diagnostics, and admin login attempts.

How it works:

1. The server builds a route-and-client-IP key.
2. The key is SHA-256 hashed before it is stored.
3. The server calls the atomic `public.consume_rate_limit` database function
   through the Supabase service-role client.
4. `public.rate_limit_buckets` stores the hashed key, request count, and reset
   time.
5. Limits are shared across Vercel instances and survive server restarts.
6. Protected requests fail closed with HTTP 503 if the durable rate-limit store
   is unavailable or returns an invalid response.

Protected routes and current defaults:

1. Bike Tag submission: 10 attempts per 10 minutes
2. Submit diagnostics: 30 attempts per 10 minutes
3. Admin login: 5 attempts per 10 minutes

Environment variables:

```text
NUXT_SUBMIT_RATE_LIMIT_ATTEMPTS
NUXT_SUBMIT_RATE_LIMIT_WINDOW_MS
NUXT_SUBMIT_DIAGNOSTIC_RATE_LIMIT_ATTEMPTS
NUXT_SUBMIT_DIAGNOSTIC_RATE_LIMIT_WINDOW_MS
NUXT_ADMIN_LOGIN_RATE_LIMIT_ATTEMPTS
NUXT_ADMIN_LOGIN_RATE_LIMIT_WINDOW_MS
```

A blocked request returns HTTP 429 with the remaining retry time.

Possible future improvements:

1. Add hosting-platform or edge-level protection.
2. Add stronger abuse detection and monitoring.

## Image Upload Validation

Allowed image types:

```text
image/jpeg
image/png
image/webp
```

Allowed extensions:

```text
jpg
jpeg
png
webp
```

Current validation checks:

1. File is required
2. MIME type is allowed
3. Extension is allowed
4. MIME type matches extension
5. File size is greater than zero
6. File size is no larger than 8 MB
7. Decoded image content matches the declared type
8. EXIF orientation is applied
9. Images are capped at 2400 pixels
10. Uploads are normalized to WebP
11. EXIF and GPS metadata are stripped

HEIC is not supported yet.

Future HEIC support should convert HEIC uploads to jpg or webp before storage.

## Supabase Storage

Storage uses:

```text
bike_tag_pending_photos
bike_tag_photos
```

Current behavior:

1. Pending submission photos are sanitized and uploaded to a private bucket.
2. Admin review uses signed URLs for private pending photos.
3. Approved photos are copied to unique paths in the public bucket.
4. Approved public photo URLs are stored in `public.tags`.
5. Rejected private photos are deleted when possible.
6. Approval removes the private source photos after successful promotion.
7. The service role key is used only on the server.

Current limitation:

1. Published tag photos remain public by design.
2. Uploaded photo cleanup is best effort.
3. Scheduled cleanup for old unreferenced files is planned but not implemented.

Future improvement:

1. Add scheduled cleanup dry run for old unreferenced files.
2. Add scheduled cleanup deletion mode after dry run verification.
3. Add structured cleanup logging.

## Failed Upload Cleanup

Supabase submit uploads photos before creating the pending submission.

Current cleanup behavior:

1. Track uploaded storage paths during submit
2. If pending submission creation succeeds, keep uploaded photos
3. If pending submission creation fails, delete uploaded photos
4. Return the original submit error
5. Log cleanup errors on the server
6. Do not let cleanup errors hide the original failure

Future improvement:

1. Add structured logging
2. Add automated tests for partial failure behavior
3. Add scheduled cleanup for old unreferenced uploads

## Rejected Submission Photo Cleanup

Rejected submission cleanup removes uploaded photos when possible.

Current behavior:

1. Admin rejects a pending submission
2. Rejection metadata is saved
3. Match photo storage path is loaded from the submission
4. Next tag photo storage path is loaded from the submission
5. Both rejected private photo paths are deleted from Supabase Storage
6. Cleanup failures are logged
7. Cleanup failures do not block the rejection response
8. Rejected submission row remains available for audit history

Security value:

1. Reduces unnecessary private file retention
2. Preserves moderation audit history
3. Prevents storage cleanup failures from blocking admin decisions

## Scheduled Storage Cleanup

Scheduled storage cleanup is planned for old unreferenced files.

This should not delete files that are still referenced by `public.tags` or `public.submissions`.

The first implementation should use dry run behavior.

Dry run behavior:

1. Scan the configured storage buckets
2. Find files referenced by `public.tags`
3. Find files referenced by `public.submissions`
4. Identify old unreferenced files outside the grace period
5. Log cleanup candidates
6. Do not delete files

Deletion mode should only be added after dry run behavior is verified.

Deletion mode should:

1. Delete only old unreferenced files
2. Keep all referenced active tag photos
3. Keep all referenced found tag photos
4. Keep all referenced pending submission photos
5. Keep all referenced approved submission photos
6. Skip files inside the grace period
7. Log deleted paths
8. Log cleanup failures
9. Continue when one file fails deletion

Recommended initial grace period:

```text
7 days
```

Security value:

1. Reduces long term storage drift
2. Limits orphaned files
3. Preserves current game photos
4. Preserves moderation audit history
5. Adds a safer path to cleanup before enabling deletion

## Security Headers

The app adds baseline security headers through server middleware.

Current headers:

```text
X-Content-Type-Options
X-Frame-Options
Referrer-Policy
Permissions-Policy
Cross-Origin-Opener-Policy
X-XSS-Protection
Strict-Transport-Security outside local development
```

Purpose:

1. Reduce browser content sniffing
2. Block iframe embedding
3. Limit referrer leakage
4. Disable unused browser permissions
5. Improve cross origin isolation
6. Enforce HTTPS in deployed environments

## Supabase Service Role Permissions

The service role needs access to the `public.tags` table.

```sql
grant usage on schema public to service_role;
grant select, insert, update, delete on public.tags to service_role;
```

The service role needs access to the `public.submissions` table.

```sql
grant select, insert, update, delete on public.submissions to service_role;
```

The service role also needs execute permission for moderation functions.

```sql
grant execute on function public.create_pending_submission(
  text,
  text,
  text,
  text,
  text,
  text,
  text
) to service_role;

grant execute on function public.approve_submission(
  uuid,
  text
) to service_role;

grant execute on function public.reject_submission(
  uuid,
  text,
  text
) to service_role;

grant execute on function public.consume_rate_limit(
  text,
  integer,
  bigint
) to service_role;
```

After creating or replacing functions, reload the Supabase schema cache.

```sql
notify pgrst, 'reload schema';
```

## Current Known Risks

Known risks before public launch:

1. There is no user ownership for public submissions.
2. There is no automated malware scanning.
3. Scheduled cleanup for old unreferenced uploads is planned but not implemented.
4. Scheduled cleanup deletion mode needs dry run verification first.
5. Admin authorization has one permission level rather than role tiers.

## Recommended Next Security Work

Recommended next improvements:

1. Add structured server and admin audit logging.
2. Add scheduled cleanup dry run for old unreferenced uploads.
3. Add scheduled cleanup deletion mode after dry run verification.
4. Add security-focused integration tests.
5. Add admin role tiers only if the product needs different permission levels.

## Launch Readiness Checklist

Before public launch:

1. Public Settings only shows user-safe preferences.
2. Reset API is blocked outside development.
3. System status API is blocked outside development.
4. Service role key is server only.
5. Supabase admin authentication is enabled.
6. Approved Auth users must exist in `public.admin_users`.
7. Admin access tokens are stored only in httpOnly cookies.
8. Static API-token and bearer-header admin authentication are disabled.
9. Admin mutation routes enforce same-origin requests.
10. Submit, diagnostics, and admin login APIs use durable rate limiting.
11. Deployed submit requests use Vercel BotID verification.
12. Submit API validates all text fields.
13. Submit API validates and sanitizes all uploaded images.
14. Pending submission photos are stored privately.
15. Public submit creates pending submissions.
16. Admin approval route is protected.
17. Admin rejection route is protected.
18. Hidden active map URL is not exposed.
19. Locked clue is not exposed before unlock.
20. Security headers are enabled.
21. Supabase permissions are documented.
22. Supabase submit smoke test passes.
23. Production environment uses Supabase mode.
24. Production environment does not expose `.env`.
25. Rejected submission photo cleanup is implemented.
