# Bike Tag Roadmap

## Purpose

This document tracks planned Bike Tag work by priority.

The goal is to keep future work organized without crowding the README.

## Current Focus

Bike Tag is currently focused on building a stable first playable version with:

1. Public current tag view
2. Public tag history
3. Public submit flow
4. Admin moderation
5. Supabase backed storage
6. Basic automated tests
7. CI verification
8. Clear project documentation

## Now

These items should come before larger product expansion.

### Product

1. Keep the current tag page simple and reliable
2. Keep the submit flow easy to understand
3. Keep the admin review flow stable
4. Improve empty states and loading states where needed
5. Confirm mobile layout works well for core pages

### Backend

1. Keep Supabase mode working for real submits
2. Keep mock mode useful for local development
3. Preserve current tag state during rejected submissions
4. Preserve tag history during approved submissions
5. Keep rejected photo cleanup working

### Testing

1. Maintain unit tests for validation utilities
2. Maintain unit tests for submit form parsing
3. Maintain unit tests for storage URL parsing
4. Keep CI green on pull requests into `develop`
5. Run manual smoke tests for moderation and storage changes

### Documentation

1. Keep setup docs current
2. Keep moderation docs current
3. Keep storage docs current
4. Keep testing docs current
5. Keep README links current

## Next

These items are strong candidates after the first stable moderated flow is comfortable.

### Supabase Auth

Add user authentication for safer admin and player behavior.

Potential work:

1. Add Supabase Auth setup
2. Add admin users
3. Replace shared admin token with authenticated admin access
4. Add role checks for admin routes
5. Decide whether public submit requires login

### Admin Roles

Add clearer permissions for admin features.

Potential roles:

1. Viewer
2. Reviewer
3. Admin

Potential behavior:

1. View pending submissions
2. Approve submissions
3. Reject submissions
4. View rejected submission history
5. Manage game settings

### Scheduled Storage Cleanup

Implement the scheduled cleanup plan documented in storage docs.

Potential work:

1. Add dry run cleanup mode
2. Log cleanup candidates
3. Protect referenced files
4. Add grace period support
5. Add deletion mode after dry run verification
6. Add manual smoke checklist for cleanup behavior

### Image Processing

Improve uploaded image handling.

Potential work:

1. Resize large photos
2. Compress uploaded photos
3. Normalize image format
4. Add HEIC conversion support
5. Improve image validation messages

### Admin Dashboard Improvements

Improve the admin review experience.

Potential work:

1. Better submission filters
2. Better submission search
3. Better status summaries
4. Better photo previews
5. Better error recovery
6. Better review history display

## Later

These items are useful, but should wait until the core game is stable.

### Private Storage Or Signed URLs

Move away from fully public storage if needed.

Potential work:

1. Evaluate private bucket support
2. Add signed URL generation
3. Protect pending submission photos
4. Protect rejected submission photos
5. Keep public tag history available

### Multiple Games

Support more than one Bike Tag game.

Potential work:

1. Add games table
2. Add game specific tag lists
3. Add game specific settings
4. Add game specific storage folders
5. Add game specific admin access

### Player Profiles

Support player identity and history.

Potential work:

1. Add player profiles
2. Link submissions to players
3. Show player stats
4. Show player tag history
5. Add optional profile photos

### Comments Or Reactions

Add lightweight community features.

Potential work:

1. Comments on found tags
2. Reactions on tags
3. Basic moderation for comments
4. Abuse reporting

### Notifications

Notify players and admins about important events.

Potential work:

1. Notify admins about pending submissions
2. Notify players when a tag is approved
3. Notify players when a tag is rejected
4. Notify followers when a new tag is live

## Future Testing

Testing should grow with the app.

### Playwright

Future browser tests can cover:

1. Current tag page loads
2. Submit flow reaches review screen
3. Submit confirmation page appears
4. Tags page search works
5. Settings theme toggle works
6. Admin review page loads
7. Admin approval flow works with mocked backend
8. Admin rejection flow works with mocked backend

### API Tests

Future API tests can cover:

1. Current tag endpoint
2. Tag list endpoint
3. Tag detail endpoint
4. Submit endpoint
5. Admin approval endpoint
6. Admin rejection endpoint

### Integration Tests

Future Supabase integration tests should wait until there is a clear strategy for:

1. Test database
2. Test storage bucket
3. Seed data
4. Cleanup
5. CI secrets
6. Local developer setup

## Launch Readiness

Before public launch, confirm:

1. Production environment values are configured
2. Supabase mode is enabled in production
3. Service role key is server only
4. Admin access strategy is acceptable
5. Submit rate limiting is acceptable
6. Image upload limits are acceptable
7. Public submit flow is tested
8. Admin approval flow is tested
9. Admin rejection flow is tested
10. Rejected photo cleanup is tested
11. CI passes
12. Manual smoke checks pass
13. README and setup docs are current

## Open Decisions

These decisions should be made before launch or larger expansion.

1. Should public submit require authentication?
2. Should admin access stay token based for MVP?
3. Should storage remain public for MVP?
4. What image size should be used after compression?
5. Should HEIC support be added before launch?
6. How long should scheduled cleanup wait before deleting old unreferenced files?
7. Should there be one game only or support for multiple games?
8. Should player names remain free text or connect to user accounts?
9. Should rejected submissions stay visible to admins forever?
10. What hosting platform should production use?

## Recently Completed

Completed foundational work:

1. Supabase project setup
2. Supabase submit flow
3. Pending submissions
4. Admin approval
5. Admin rejection
6. Rejected photo cleanup
7. Moderation smoke checklist
8. Unit test setup
9. Map validation tests
10. Submit form data tests
11. GitHub Actions CI
12. Local `npm run verify` command
13. Pull request template
14. Issue templates
15. Contributing guide
16. Development setup guide
17. Testing strategy guide