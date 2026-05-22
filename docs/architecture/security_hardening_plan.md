# Bike Tag Security Hardening Plan

## Purpose

This document tracks the current security posture for Bike Tag and the next security improvements needed before public launch.

Bike Tag now supports real Supabase reads, photo uploads, moderated submissions, and protected admin approval or rejection. Because public users can submit files and propose game state changes, security needs to stay ahead of new features.

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

These APIs are protected by an admin token:

```text
POST /api/admin/submissions/:id/approve
POST /api/admin/submissions/:id/reject
```

Admin requests must include:

```text
Authorization: Bearer your_admin_token
```

The token is configured with:

```text
NUXT_ADMIN_API_TOKEN
```

Rules:

1. The admin token must stay server only
2. The admin token must not use `NUXT_PUBLIC`
3. The admin token must not be committed to Git
4. The admin token should be long and random outside local development
5. Missing or incorrect admin token returns `403`

## Server Only Secrets

The Supabase service role key must only be used on the server.

Environment variable:

```text
NUXT_SUPABASE_SERVICE_ROLE_KEY
```

Rules:

1. Never expose it through public runtime config
2. Never send it to browser code
3. Never return it from an API response
4. Never commit it to Git
5. Keep it in local `.env` and deployment secret settings only

The admin API token must also only be used on the server.

Environment variable:

```text
NUXT_ADMIN_API_TOKEN
```

Rules:

1. Never expose it through public runtime config
2. Never send it to browser code
3. Never return it from an API response
4. Never commit it to Git
5. Use a long random value in deployed environments

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
8. Submit rate limiting
9. Failed upload cleanup
10. Supabase submit runs through server routes only
11. Supabase submit creates pending submissions instead of immediately changing live game state

## Moderation Protection

Bike Tag now has a basic moderation loop.

Current behavior:

1. Public submit creates a pending submission
2. Public submit does not immediately mark the active tag as found
3. Public submit does not immediately create the next active tag
4. Admin approval requires an admin token
5. Admin rejection requires an admin token
6. Approved submissions update live game state
7. Rejected submissions leave the active tag unchanged

Moderation protects against:

1. Bad submitted photos
2. Wrong found locations
3. Wrong hidden next tag locations
4. Spam submissions changing the live game
5. Accidental bad submissions
6. Intentional game disruption

Current limitation:

1. Admin access uses a shared server token
2. There is no admin UI yet
3. There is no Supabase Auth yet
4. Admin route errors can be improved
5. Rejected submission photos are not automatically deleted

Future improvement:

1. Replace admin token auth with Supabase Auth
2. Add admin roles
3. Add admin UI or CLI
4. Return cleaner admin route errors
5. Add rejection photo cleanup policy

## Submit Rate Limiting

Submit requests are rate limited by client IP.

Environment variables:

```text
NUXT_SUBMIT_RATE_LIMIT_ATTEMPTS
NUXT_SUBMIT_RATE_LIMIT_WINDOW_MS
```

Current default:

```text
10 attempts per 10 minutes
```

Future production suggestion:

```text
5 attempts per 10 minutes
```

Current limitation:

1. The rate limit is stored in server memory
2. It resets when the server restarts
3. It may not work consistently across multiple server instances

Future improvement:

1. Use hosting platform rate limits
2. Use edge protection
3. Use Redis or another shared store
4. Add stronger abuse detection

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

HEIC is not supported yet.

Future HEIC support should convert HEIC uploads to jpg or webp before storage.

## Supabase Storage

The storage bucket is:

```text
bike_tag_photos
```

Current behavior:

1. Supabase submit uploads the matching photo
2. Supabase submit uploads the next tag photo
3. Uploaded photo public URLs are stored in `public.submissions`
4. Approved submission photo URLs are copied into `public.tags`
5. Public APIs can return public photo URLs for active and found tags
6. The service role key is used only on the server

Current limitation:

1. The bucket is public
2. Images are not resized
3. Images are not compressed
4. Uploaded photo cleanup is best effort
5. Rejected submission photos are retained for now

Future improvement:

1. Add image resizing
2. Add image compression
3. Add private bucket support with signed URLs
4. Add scheduled cleanup for unreferenced files
5. Add policy for deleting rejected submission photos

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

grant select, insert, update, delete
on public.tags
to service_role;
```

The service role needs access to the `public.submissions` table.

```sql
grant select, insert, update, delete
on public.submissions
to service_role;
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
```

After creating or replacing functions, reload the Supabase schema cache.

```sql
notify pgrst, 'reload schema';
```

## Current Known Risks

Known risks before public launch:

1. Admin access uses a shared token instead of user based auth
2. There is no admin UI
3. There is no Supabase Auth
4. There is no user ownership
5. Storage bucket is public
6. Rate limiting is in memory only
7. Uploaded images are not resized or compressed
8. There is no automated malware scanning
9. There is no scheduled cleanup for unreferenced uploads
10. Rejected submission photos are retained
11. Admin route errors can be more precise

## Recommended Next Security Work

Recommended next improvements:

1. Improve admin route error handling
2. Add admin list and detail routes
3. Add Supabase Auth
4. Add admin role checks
5. Add production grade rate limiting
6. Add image resizing and compression
7. Add private storage or signed URL strategy
8. Add structured server logging
9. Add audit fields for admin actions
10. Add cleanup job for orphaned uploads
11. Add security focused tests

## Launch Readiness Checklist

Before public launch:

1. Public Settings only shows user safe preferences
2. Reset API is blocked outside development
3. System status API is blocked outside development
4. Service role key is server only
5. Admin API token is server only
6. Submit API is rate limited
7. Submit API validates all text fields
8. Submit API validates all uploaded images
9. Public submit creates pending submissions
10. Admin approval route is protected
11. Admin rejection route is protected
12. Hidden active map URL is not exposed
13. Locked clue is not exposed before unlock
14. Security headers are enabled
15. Supabase permissions are documented
16. Supabase submit smoke test passes
17. Production environment uses Supabase mode
18. Production environment does not expose `.env`
19. Admin auth strategy is decided
20. Rejected submission photo policy is decided