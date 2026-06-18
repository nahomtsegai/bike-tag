# Bike Tag Testing Strategy

## Purpose

Bike Tag uses layered automated tests so fast logic checks remain separate from browser behavior, database migrations, and the complete moderated workflow.

The goals are:

1. Catch regressions before promotion
2. Keep tests deterministic and safe to retry
3. Exercise Supabase behavior without writing to hosted Preview or Production projects
4. Verify migrations in an isolated local database
5. Preserve manual Preview checks for integrations that require real hosted services
6. Produce useful artifacts when CI fails

## Test Layers

| Layer | Main command | Data source |
| --- | --- | --- |
| Unit | `npm run test:run` | Mocked dependencies |
| API | `npm run test:api` | Local Nuxt with mock data |
| Browser | `npm run test:e2e` | Local Nuxt with mock data |
| API + browser | `npm run test:integration` | Local Nuxt with mock data |
| Database migrations | `npm run test:db:ci` | Isolated local Supabase |
| Submit/admin workflow | `npm run test:e2e:workflow` | Isolated local Supabase |
| Full verification | `npm run verify:full` | All applicable local layers |

## Unit Tests

Framework:

```text
Vitest
```

Location:

```text
tests/unit
```

Unit tests cover logic that should be fast and independent of a running application, including:

- Form and multipart parsing
- Image, map, location, and text validation
- Storage-path and URL handling
- Admin authentication and authorization helpers
- Rate-limit behavior
- Photo promotion and cleanup
- Storage cleanup candidate selection
- Audit event transformation and pagination
- Error handling and diagnostic helpers

Run:

```bash
npm run test:run
```

External services should be mocked at this layer. Unit tests must not require Supabase, Resend, Vercel, or production credentials.

## API Tests

Framework:

```text
Playwright APIRequestContext
```

Location:

```text
tests/api
```

The API suite starts a local Nuxt server with the mock data source.

Representative coverage includes:

- Current-tag, tag-history, and tag-detail contracts
- Hidden-location field protection
- Missing-resource and validation errors
- Unauthenticated admin session behavior
- Protected admin route behavior
- Public submission-reference validation
- Security-sensitive response behavior

Run:

```bash
npm run test:api
```

API tests must not call hosted Supabase projects or require secrets.

## Browser End-to-End Tests

Framework:

```text
Playwright Chromium
```

Location:

```text
tests/e2e
```

Representative coverage includes:

- Public-page rendering and navigation
- Current-tag behavior
- Tag-history filtering and detail navigation
- Empty states
- Theme persistence
- Mobile navigation
- Submission form behavior that can be tested safely with mocks

Run:

```bash
npm run test:e2e
```

Run headed while debugging:

```bash
npm run test:e2e:headed
```

The standard browser suite uses the mock data source and remains independent of hosted data.

## API and Browser Integration Suite

Run both Playwright projects:

```bash
npm run test:integration
```

The Playwright configuration starts Nuxt on:

```text
http://127.0.0.1:4173
```

Configuration:

```text
playwright.config.ts
```

## Migration-Backed Database Tests

Command:

```bash
npm run test:db:ci
```

This step:

1. Starts an isolated local Supabase stack
2. Applies the repository migrations
3. Runs the Supabase database test suite
4. Writes output to `playwright-report/database-ci.log`
5. Stops the local stack without retaining test data

The command intentionally skips outside CI. This keeps ordinary local `npm run verify` runs lightweight while ensuring every protected-branch CI run validates the migration chain.

Docker must be available wherever the database test executes.

## Local Supabase Workflow Tests

Command:

```bash
npm run test:e2e:workflow
```

Locations:

```text
tests/workflow
playwright.workflow.config.ts
scripts/run-workflow-e2e.mjs
```

The workflow runner:

1. Starts an isolated local Supabase stack
2. Reads its temporary API URL and keys
3. Starts Nuxt in Supabase mode on port `4174`
4. Creates isolated test data and an admin account
5. Exercises the submit and moderation workflow
6. Stops Supabase without preserving test data

This layer is intended for behavior that mocks cannot adequately verify, such as:

- Real migration and RPC behavior
- Authenticated admin sessions
- Private pending-photo storage
- Submission creation
- Approval and rejection state transitions
- Published-photo promotion
- Superseding competing submissions
- Cleanup and audit side effects

The workflow must remain fully isolated from Preview and Production.

## Verification Commands

Standard app verification:

```bash
npm run verify
```

This runs:

1. Unit tests
2. Type checks
3. Production build
4. Migration-backed database tests in CI

The database step safely skips outside CI.

Every automated check:

```bash
npm run verify:full
```

This runs `verify`, the standard API/browser suite, and the local Supabase workflow suite.

Hosted migration parity check:

```bash
npm run check:migrations:hosted
```

Run the parity command only with the intended hosted environment values loaded. It is an operational check, not a substitute for local migration tests.

## Continuous Integration

GitHub Actions runs for pull requests and pushes involving:

- `develop`
- `preview`
- `production`

CI performs:

```bash
npm ci
npm run verify
npx playwright install --with-deps chromium
npm run test:integration
npm run test:e2e:workflow
```

The `Verify app` job therefore covers unit tests, type checks, production build, database migrations, API tests, browser tests, and the local Supabase submit/admin workflow.

## CI Artifacts

The workflow uploads `playwright-report/` even when a test step fails, unless the workflow is cancelled.

The artifact can include:

- Playwright HTML report
- Screenshots, traces, and videos
- `verify.log`
- `workflow.log`
- `database-ci.log`

Use the artifact before rerunning a failed job so the original failure evidence is not lost.

## Hosted Preview and Production Checks

Automated tests intentionally avoid modifying hosted environments.

Continue manual Preview testing for changes involving:

1. Photo preparation with real phone images
2. HEIC and HEIF selection on supported devices
3. Private pending-photo uploads
4. Signed admin review URLs
5. Submission approval and published-photo promotion
6. Rejection, archive, deletion, and superseding cleanup
7. Current-tag and history updates after approval
8. Email notification behavior
9. Durable rate limiting
10. Scheduled storage cleanup dry-run output
11. Hosted migration parity

Useful checklists:

```text
docs/architecture/moderation_smoke_test.md
docs/architecture/supabase_submit_smoke_test.md
```

A future hosted smoke workflow should remain read-only and verify route availability, public API contracts, authentication boundaries, and security headers after promotions.

## Test Design Rules

Tests should be:

1. Deterministic
2. Independent
3. Readable
4. Focused on user-visible, API, database, or security behavior
5. Free of production secrets
6. Safe to retry
7. Explicit about whether they use mocks or local Supabase
8. Responsible for cleaning up their own temporary state

Avoid tests that:

1. Depend on execution order
2. Write to Preview or Production
3. Assume mutable hosted data
4. Use arbitrary sleeps instead of observable readiness
5. Assert private implementation details without a behavioral reason
6. Leave a local Supabase stack or test server running after failure
7. Hide useful failure output

## Pull Request Expectations

Before merging a code change, run the most relevant local checks and allow the protected-branch CI workflow to complete.

Preferred local command:

```bash
npm run verify:full
```

For documentation-only changes, review rendered Markdown and rely on CI for repository-wide verification. The PR should clearly state that no runtime behavior changed.

Document any manual Preview smoke testing for changes involving Supabase, storage, authentication, admin review, submissions, notifications, migrations, or scheduled operations.
