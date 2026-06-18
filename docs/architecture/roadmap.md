# Bike Tag Roadmap

## Purpose

This document tracks the next meaningful Bike Tag investments without treating already-shipped work as future scope.

The roadmap is organized around the current production baseline, near-term reliability work, product improvements, and longer-term expansion.

## Current Production Baseline

Bike Tag now has a complete moderated game loop:

1. Riders view the active tag and its clue state.
2. Riders submit a matching photo and a new hidden location.
3. Source photos are validated, prepared, and uploaded.
4. Authenticated admins review submissions.
5. Approval completes the current tag and publishes the next tag.
6. Rejection, deletion, and superseding preserve game state and clean up private photos.
7. Completed tags appear in public history and on the map.

### Public product

- Current tag, tag history, tag detail, map, rules, and settings pages
- Search and pagination for completed tags
- Device-captured found and next-tag locations
- Automatic clue reveal timing
- Responsive light, dark, and system themes
- Submission success references

### Submission safety

- Server-side form, map, image, and location validation
- Client-side image preparation and compression
- JPEG, PNG, HEIC, and HEIF source support
- Durable database-backed rate limiting
- Active-tag submission binding and stale-request rejection
- Structured submit diagnostics
- Resend admin notifications

### Admin and moderation

- Supabase Auth email-and-password access
- Authorization through `public.admin_users`
- Search, status filtering, pagination, and summary counts
- Private pending-photo storage and signed review URLs
- Approval, rejection, archive, and deletion workflows
- Automatic superseding of competing pending submissions
- Admin activity and audit-history page

### Operations

- Separate Development, Preview, and Production branches
- Separate Preview and Production Supabase environments
- Protected PR-based promotion flow
- Unit, API, browser, database, and local Supabase workflow tests
- Hosted migration parity checks
- Daily observation-only storage cleanup scans

## Current Focus

The current focus is keeping the production game reliable and easy to operate before adding broader social features.

### 1. Keep documentation accurate

- Update setup and environment instructions when implementation changes
- Keep the README aligned with the current framework and release process
- Keep moderation, storage, migration, and testing docs aligned with production
- Remove completed work from future-roadmap sections

### 2. Add deployed-environment smoke checks

Create safe read-only checks for Preview and Production after promotion.

Potential coverage:

1. Homepage responds successfully
2. Current-tag API returns the expected contract
3. Tag history and tag detail routes respond
4. Admin routes reject unauthenticated access
5. Expected security headers are present
6. Preview and Production report the expected public site behavior
7. A failed smoke run produces an actionable deployment report

These checks must not create submissions or modify live game data.

### 3. Improve operational visibility

- Define alerts for repeated submit failures
- Surface storage cleanup candidate trends
- Monitor notification failures
- Make audit-event failures easier to investigate
- Document the production incident and rollback workflow

### 4. Decide the storage cleanup deletion path

The scheduled scanner is intentionally dry-run only.

Before adding deletion mode:

1. Review candidate output in Preview and Production
2. Confirm referenced files are always protected
3. Confirm the grace period is appropriate
4. Define maximum deletion batch size
5. Add an explicit deletion kill switch
6. Add audit records for every deletion run
7. Add recovery guidance before enabling scheduled deletion

### 5. Define admin permission levels

Current admin access is membership-based: authorized users have the same capabilities.

Potential roles:

- Viewer: view submissions and audit history
- Reviewer: approve and reject submissions
- Admin: archive, delete, manage storage cleanup, and manage access

Role work should include server-side authorization checks, migration coverage, UI behavior, and audit events.

## Next Product Improvements

These are good candidates after the operational work above is comfortable.

### Admin workflow refinements

- Derive reviewer identity from the authenticated account
- Improve recovery when a signed image URL expires
- Add clearer links between submissions and audit events
- Improve bulk navigation through large review queues
- Add better summaries for superseded and archived submissions

### Image quality tuning

- Review current compression results across common phones
- Define target dimensions and quality thresholds
- Preserve useful metadata only when it is safe
- Improve user-facing preparation progress and failure messages
- Add regression fixtures for large and unusual mobile images

### Player authentication decision

Public submissions currently use a rider name rather than a player account.

Before adding player authentication, decide:

1. Whether anonymous submissions remain allowed
2. Whether existing free-text rider history should be linked to accounts
3. What profile data is public
4. How account deletion affects tag history
5. Whether approval and rejection notifications require an account

### Public game polish

- Continue mobile usability checks on the core flow
- Improve slow-network and offline messaging
- Refine empty and first-game states
- Improve map accessibility and keyboard behavior
- Add optional sharing metadata for active and completed tags

## Later

These ideas are useful, but should follow a sustained period of reliable single-game operation.

### Multiple games

- Games table and game-specific settings
- Game-specific tag, submission, storage, and admin scopes
- Custom domains or paths per game
- Migration plan for the existing Louisville game

### Player profiles and statistics

- Player profiles
- Approved finds and created-tag history
- Participation statistics
- Optional profile photos
- Privacy and account-deletion controls

### Community features

- Reactions or comments on completed tags
- Abuse reporting
- Comment moderation and audit history
- Opt-in following and notifications

### Additional notifications

- Rider approval and rejection notifications
- New active-tag notifications
- Storage or migration operations alerts
- Admin digest for pending submissions

## Testing Roadmap

Testing should grow where it reduces production risk rather than simply increasing test count.

### Near term

1. Read-only hosted smoke tests
2. More failure-path coverage for the local Supabase workflow
3. Admin role authorization tests when roles are introduced
4. Storage cleanup deletion tests before deletion mode exists
5. Migration parity checks in promotion documentation

### Continue maintaining

- Validation and transformation unit tests
- Admin API authorization and contract tests
- Public API hidden-field protection
- Browser coverage for core public navigation
- Local Supabase approval and rejection workflow tests
- Database migration tests
- Manual Preview checks for real storage and notification behavior

## Operational Readiness Checklist

Before each production promotion, confirm:

1. Feature PR CI is green on `develop`
2. Preview promotion PR CI is green
3. Required Supabase migrations are applied and parity is verified
4. Preview deployment is ready
5. Relevant Preview smoke tests pass
6. No unexpected storage cleanup candidates or runtime errors are present
7. Production promotion PR CI is green
8. Production deployment is ready
9. Live read-only smoke checks pass
10. Rollback or follow-up notes are recorded for risky changes

## Open Decisions

1. Should public submissions eventually require authentication?
2. Which admin roles are worth supporting?
3. When should storage cleanup move beyond dry-run mode?
4. What deletion grace period and batch limit are safe?
5. What image dimensions and quality target should be standard?
6. Should published tag photos remain public objects?
7. How long should rejected, archived, superseded, and audit records be retained?
8. Should the project remain one Louisville game or support multiple games?
9. How should existing free-text rider names map to future accounts?
10. Which operational failures should trigger immediate alerts?

## Recently Completed

Recent reliability and product work includes:

1. Supabase Auth-backed admin access
2. Private pending-photo storage with signed URLs
3. Durable database-backed submit rate limiting
4. Submit diagnostics and upload cleanup
5. Client-side photo preparation and compression
6. HEIC and HEIF source-photo support
7. Active-tag submission binding and conflict handling
8. Automatic superseding of competing submissions
9. Admin submission filters, search, summaries, and pagination
10. Admin activity and audit history
11. Scheduled storage cleanup dry run
12. Migration-backed database tests
13. Hosted migration parity tooling and repair
14. Full local Supabase submit-and-admin workflow tests
15. Protected `develop` to `preview` to `production` promotion flow
