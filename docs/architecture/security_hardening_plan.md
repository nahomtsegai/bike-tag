# Bike Tag Security Hardening Plan

## Purpose

This document tracks the current security posture for Bike Tag and the next security improvements needed before public launch.

Bike Tag now supports real Supabase reads, photo uploads, and submit writes. Because public users can submit files and change game state, security needs to stay ahead of new features.

## Current Security Goals

The app should protect:

1. Supabase service role key
2. Hidden active tag location
3. Hidden active tag clue before unlock
4. Uploaded photos
5. Submit API
6. Reset behavior
7. Internal system status
8. Public user experience
9. Game integrity

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
2. Hidden active map URL
3. Locked clue before unlock time
4. Private backend configuration
5. Admin only data

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
4. Supabase mode is used for real backend reads and submits

## Submit API Protection

The submit API is the highest risk public endpoint because it can:

1. Upload photos
2. Write to Supabase Storage
3. Update the `tags` table
4. Mark the active tag as found
5. Create the next active tag

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
3. Uploaded photo public URLs are stored in `public.tags`
4. Public APIs can return public photo URLs
5. The service role key is used only on the server

Current limitation:

1. The bucket is public
2. Images are not resized
3. Images are not compressed
4. Uploaded photo cleanup is best effort

Future improvement:

1. Add image resizing
2. Add image compression
3. Add private bucket support with signed URLs
4. Add scheduled cleanup for unreferenced files

## Failed Upload Cleanup

Supabase submit uploads photos before calling the database submit function.

Current cleanup behavior:

1. Track uploaded storage paths during submit
2. If database submit succeeds, keep uploaded photos
3. If database submit fails, delete uploaded photos
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

The service role also needs execute permission for the submit function.

```sql
grant execute on function public.submit_bike_tag(
  text,
  text,
  text,
  text,
  text,
  text,
  text
) to service_role;
```

After creating or replacing the submit function, reload the Supabase schema cache.

```sql
notify pgrst, 'reload schema';
```

## Current Known Risks

Known risks before public launch:

1. Public submissions immediately replace the active tag
2. There is no admin approval workflow
3. There is no authentication
4. There is no user ownership
5. There is no moderation queue
6. Storage bucket is public
7. Rate limiting is in memory only
8. Uploaded images are not resized or compressed
9. There is no automated malware scanning
10. There is no scheduled cleanup for unreferenced uploads

## Recommended Next Security Work

Recommended next improvements:

1. Add moderation before a submitted tag becomes active
2. Add admin approval workflow
3. Add Supabase Auth
4. Add production grade rate limiting
5. Add image resizing and compression
6. Add private storage or signed URL strategy
7. Add structured server logging
8. Add audit fields for submit actions
9. Add cleanup job for orphaned uploads
10. Add security focused tests

## Launch Readiness Checklist

Before public launch:

1. Public Settings only shows user safe preferences
2. Reset API is blocked outside development
3. System status API is blocked outside development
4. Service role key is server only
5. Submit API is rate limited
6. Submit API validates all text fields
7. Submit API validates all uploaded images
8. Hidden active map URL is not exposed
9. Locked clue is not exposed before unlock
10. Security headers are enabled
11. Supabase permissions are documented
12. Supabase submit smoke test passes
13. Production environment uses Supabase mode
14. Production environment does not expose `.env`
15. Admin or moderation strategy is decided