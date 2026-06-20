# Bike Tag Security Hardening Plan

## Purpose

This document describes Bike Tag's current production security posture and the next hardening work that remains.

Bike Tag supports public tag discovery, moderated rider submissions, private pending-photo storage, authenticated admin review, durable rate limiting, audit history, hosted deployment verification, and observation-only storage cleanup.

Because public users can upload files and propose game-state changes, security work should continue to prioritize data privacy, moderation integrity, abuse resistance, and recoverability.

## Security Goals

Bike Tag should protect:

1. Supabase service-role credentials
2. Supabase Auth admin sessions
3. Hidden active-tag location data
4. Locked clues before their reveal time
5. Pending submission photos
6. Public submit and diagnostics endpoints
7. Admin review and destructive actions
8. Audit and diagnostic records
9. Production availability and recovery paths
10. Game integrity

## Public Surface

Public pages include:

```text
/current-tag
/tags
/map
/rules
/submit
/settings
```

Public APIs include:

```text
GET /api/tags/current
GET /api/tags
GET /api/tags/:id
POST /api/tags/submit
```

Public responses must not expose:

1. Supabase service-role credentials
2. Admin session credentials
3. Hidden active-tag map data
4. Locked clue content before reveal
5. Private pending-photo paths or signed URLs
6. Admin-only submission, error, or audit data
7. Private deployment configuration

## Development-Only Surface

Development-only routes include:

```text
GET /api/system/data-source
POST /api/tags/reset
```

Current protections:

1. System data-source status is blocked outside development.
2. Reset is blocked outside development.
3. Reset is blocked when the active data source is Supabase.
4. Reset is limited to local mock-mode workflows.

## Protected Admin Surface

Admin data and mutations are protected by Supabase Auth and membership in `public.admin_users`.

Protected routes include:

```text
GET /api/admin/submissions
GET /api/admin/submissions/:id
POST /api/admin/submissions/:id/approve
POST /api/admin/submissions/:id/reject
POST /api/admin/submissions/:id/archive
POST /api/admin/submissions/:id/delete
GET /api/admin/errors
GET /api/admin/audit-events
POST /api/admin/tags/opening
POST /api/admin/cleanup/delete-game-data
```

Authentication and authorization behavior:

1. Admins sign in with Supabase email and password.
2. The server verifies that the authenticated user exists in `public.admin_users`.
3. The access token is stored in an httpOnly, SameSite=Strict cookie scoped to `/api/admin`.
4. Protected routes validate the session on the server.
5. Admin mutation routes enforce same-origin requests.
6. Missing, expired, or unauthorized sessions return `403`.
7. Static API-token and bearer-header admin authentication are disabled.

## Server-Only Secrets

The Supabase service-role key is server-only:

```text
NUXT_SUPABASE_SERVICE_ROLE_KEY
```

Rules:

1. Never expose it through public runtime configuration.
2. Never send it to browser code.
3. Never return it from an API response.
4. Never commit it to Git.
5. Store it only in local `.env` files and deployment secret settings.

The public Supabase anon key may be exposed to the browser, but it is not an admin credential. Admin authorization remains enforced by Supabase Auth, `public.admin_users`, and protected server routes.

## Submit API Protection

The submit API is the highest-risk public endpoint because it accepts files and creates pending game-state proposals.

Current protections:

1. Required text validation
2. Google Maps URL validation
3. Device-location validation
4. Active-tag submission binding
5. Stale-request rejection
6. Required image validation
7. MIME type and extension validation
8. Prepared-file size validation
9. Durable database-backed rate limiting
10. Private pending-photo uploads
11. Failed-upload cleanup
12. Structured submit diagnostics
13. Server-only Supabase writes
14. Pending moderation instead of immediate live-state changes

A public submission does not complete the current tag or publish the next tag until an authorized admin approves it.

## Moderation and Game Integrity

Current moderation behavior:

1. Public submit creates a pending submission.
2. The active tag remains unchanged while review is pending.
3. Admin approval completes the current tag and publishes the next tag.
4. Admin rejection leaves the active tag unchanged.
5. Competing pending submissions can be superseded safely.
6. Archive and deletion workflows preserve live game integrity.
7. Rejected, deleted, and superseded private photos are cleaned up when possible.
8. Review and mutation activity is recorded in admin audit history.

Current limitation:

- Authorized admins currently share one permission level. Role tiers should be added only when the product has a real need for separate viewer, reviewer, and administrator capabilities.

## Durable Rate Limiting

Bike Tag uses a Supabase/Postgres rate limiter for public submissions, submit diagnostics, and admin login attempts.

How it works:

1. The server builds a route-and-client-IP key.
2. The key is SHA-256 hashed before storage.
3. The server calls the atomic `public.consume_rate_limit` database function.
4. `public.rate_limit_buckets` stores the hashed key, request count, and reset time.
5. Limits are shared across Vercel instances and survive server restarts.
6. Protected requests fail closed with HTTP `503` if the durable store is unavailable or returns an invalid response.
7. Blocked requests return HTTP `429` with retry timing.

Current defaults:

1. Bike Tag submission: 10 attempts per 10 minutes
2. Submit diagnostics: 30 attempts per 10 minutes
3. Admin login: 5 attempts per 10 minutes

Possible future improvements:

1. Add hosting-platform or edge-level protection.
2. Add stronger abuse detection and alerting.
3. Review limits after observing real production traffic.

## Image Preparation and Validation

Accepted stored image formats are:

```text
image/jpeg
image/png
image/webp
```

Accepted stored extensions are:

```text
jpg
jpeg
png
webp
```

Current behavior:

1. JPEG, PNG, HEIC, and HEIF source photos are supported by the client preparation flow.
2. HEIC and HEIF sources are converted to a browser-renderable stored format before upload when supported.
3. Large source images are resized and compressed before upload.
4. Prepared files must use an allowed MIME type and extension pairing.
5. Prepared files must be non-empty and no larger than 8 MB.
6. Client preparation failures produce user-facing errors instead of uploading unsupported source data.
7. Server-side validation remains authoritative even after client preparation.

Remaining image work:

1. Verify quality and orientation across a broader real-device matrix.
2. Add regression fixtures for unusually large, rotated, malformed, and uncommon mobile images.
3. Improve preparation progress and slow-device messaging.
4. Define an explicit metadata-retention policy.
5. Consider malware scanning if submission volume or threat exposure warrants it.

## Supabase Storage

Bike Tag uses two storage buckets:

```text
bike_tag_photos
bike_tag_pending_photos
```

Current behavior:

1. New pending photos are uploaded to the private `bike_tag_pending_photos` bucket.
2. Pending submission rows store private object paths rather than public URLs.
3. Authenticated admin detail requests generate temporary signed review URLs.
4. Signed URLs are not stored in the database.
5. Approval copies accepted photos into the public `bike_tag_photos` bucket.
6. Permanent public URLs are created only for approved game photos.
7. Approval rollback removes new public copies if the database transaction fails.
8. Private originals are deleted after successful approval when possible.
9. Rejection, deletion, and superseding remove pending photos when possible.
10. Legacy public pending-photo records remain supported during cleanup and review.

Current limitations:

1. Approved game-history photos remain public objects by design.
2. Object cleanup is best effort during individual request failures.
3. Automatic orphan deletion is not enabled yet.
4. Retention periods for rejected, archived, superseded, and audit records are not formally defined.

## Failed-Upload and Moderation Cleanup

Failed submit cleanup:

1. Track uploaded private object paths.
2. Upload both prepared photos.
3. Create the pending submission.
4. Delete uploaded objects if pending-submission creation fails.
5. Return the original submit error.
6. Record cleanup failures without hiding the original failure.

Moderation cleanup:

1. Keep private photos while a submission is pending.
2. Promote accepted photos during approval.
3. Remove private originals after successful approval when possible.
4. Remove rejected, deleted, and superseded private photos when possible.
5. Preserve moderation and audit metadata after photo cleanup.
6. Continue the moderation decision when a cleanup attempt fails, while recording the failure for investigation.

## Scheduled Storage Cleanup

Bike Tag runs daily observation-only storage cleanup scans.

Current dry-run behavior:

1. Scan configured storage buckets.
2. Collect paths referenced by `public.tags` and `public.submissions`.
3. Exclude referenced files from cleanup candidates.
4. Exclude files inside the configured grace period.
5. Record old unreferenced candidates.
6. Do not delete any objects automatically.

Deletion mode must remain disabled until all of the following exist:

1. Candidate output has been reviewed in Preview and Production.
2. Referenced-file protection has been verified repeatedly.
3. The grace period is confirmed.
4. A maximum deletion batch size is enforced.
5. An explicit deletion kill switch exists.
6. Every run and deleted path is audited.
7. Recovery guidance is documented.
8. Failure handling continues safely when one object cannot be deleted.

## Diagnostics, Audit History, and Visibility

Current capabilities:

1. Submit failures record structured step diagnostics.
2. Admins can inspect recorded submit errors.
3. Admin mutations create audit-history records.
4. Migration parity is checked against hosted Supabase environments.
5. Read-only hosted smoke checks verify Preview and Production deployments.
6. Storage cleanup scans run in observation-only mode.

Current operational gap:

- These systems record useful evidence, but repeated production failures do not yet consistently trigger immediate alerts.

Recommended alert targets:

1. Repeated submit failures
2. Admin notification failures
3. Audit-event write failures
4. Migration parity failures
5. Hosted smoke failures
6. Unexpected cleanup candidates or cleanup scan failures
7. Durable rate-limit store failures
8. Repeated failed admin login attempts

## Security Headers

The server currently sends:

```text
X-Content-Type-Options
X-Frame-Options
Referrer-Policy
Permissions-Policy
Cross-Origin-Opener-Policy
X-XSS-Protection
Strict-Transport-Security outside local development
Content-Security-Policy-Report-Only
```

The current Content Security Policy is observation-only. It should move to an enforced `Content-Security-Policy` header only after desktop and real-device checks confirm that legitimate application behavior produces no unresolved violations.

Before enforcement, verify:

1. Public navigation and tag pages
2. Leaflet map assets and behavior
3. Supabase Auth and admin workflows
4. Signed pending-photo review URLs
5. JPEG, PNG, WebP, HEIC, and HEIF preparation paths
6. Geolocation capture
7. Preview and Production hosted smoke checks

## Database Permissions and Migration Safety

Security-sensitive database behavior is managed through versioned Supabase migrations.

Current expectations:

1. Anonymous and authenticated roles do not receive direct privileged table access.
2. Server operations use the service-role client only in server code.
3. Moderation and rate-limiting functions grant only the execution required by the server workflow.
4. Row-level security and grants are verified by migration-backed database tests.
5. Preview and Production migration versions are checked for repository parity.
6. Schema-cache reloads are included when required after function changes.

## Current Known Risks

1. Content Security Policy is report-only rather than enforced.
2. Repeated operational failures are recorded but not yet consistently alerted.
3. Automatic orphaned-object deletion is intentionally disabled pending dry-run verification and recovery controls.
4. Authorized admins share one permission level.
5. Public submissions use a free-text rider name rather than player ownership.
6. Approved game-history photos are publicly readable.
7. Automated malware scanning is not implemented.
8. Retention and deletion periods are not formally defined for all moderation and audit records.
9. Mobile Safari and broader real-device coverage remain more limited than desktop Chromium coverage.
10. A complete production incident and rollback runbook is still needed.

## Recommended Next Security Work

1. Validate and enforce the Content Security Policy.
2. Add actionable operational alerts.
3. Add Mobile Safari and broader real-device regression coverage.
4. Document incident response, rollback, and emergency kill-switch procedures.
5. Add guarded storage-cleanup deletion mode after dry-run verification.
6. Define record and object retention policies.
7. Add admin role tiers only when multiple permission levels are needed.
8. Decide whether public submissions should eventually require player authentication.
9. Evaluate malware scanning if production volume or abuse risk increases.

## Production Readiness Checklist

Before each production promotion, confirm:

1. Feature PR CI is green on `develop`.
2. Preview promotion CI is green.
3. Required Supabase migrations are applied and parity is verified.
4. Preview deployment is ready.
5. Relevant Preview smoke checks pass.
6. No unexpected storage cleanup candidates or runtime errors are present.
7. Production promotion CI is green.
8. Production deployment is ready.
9. Live read-only smoke checks pass.
10. Admin routes reject unauthenticated requests.
11. Hidden location and locked clue data remain absent from public APIs.
12. Pending photos remain private and admin review URLs are temporary.
13. Submit, diagnostics, and admin login routes use durable rate limiting.
14. Security headers are present with the expected CSP mode.
15. Rollback or follow-up notes are recorded for risky changes.
