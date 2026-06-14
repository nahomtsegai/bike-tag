# Bike Tag Testing Strategy

## Purpose

Bike Tag uses layered automated tests so fast logic checks stay separate from browser and HTTP behavior.

The goals are:

1. Catch regressions before promotion
2. Keep tests deterministic
3. Avoid writes to Preview or Production
4. Preserve manual smoke testing for real Supabase lifecycle behavior

## Test Layers

### Unit tests

Framework:

```text
Vitest
```

Location:

```text
tests/unit
```

Use unit tests for validation, transformation, server utilities, cleanup behavior, error handling, and security-sensitive logic with external services mocked.

Run:

```bash
npm run test:run
```

### API tests

Framework:

```text
Playwright APIRequestContext
```

Location:

```text
tests/api
```

The API suite starts the local Nuxt development server with:

```text
NUXT_TAG_DATA_SOURCE=mock
```

Current coverage includes:

1. Current-tag response contract
2. Found-tag response contract
3. Tag-detail behavior and missing-tag errors
4. Hidden-location field protection
5. Unauthenticated admin session behavior
6. Protected admin route behavior
7. Invalid public submission references

Run:

```bash
npm run test:api
```

API tests must not call live Supabase projects or require secrets.

### Browser end-to-end tests

Framework:

```text
Playwright Chromium
```

Location:

```text
tests/e2e
```

Current coverage includes:

1. Public-page rendering
2. Navigation to the active tag
3. Tag-history filtering and detail navigation
4. Empty search results
5. Theme persistence
6. Mobile navigation behavior

Run:

```bash
npm run test:e2e
```

Run headed while debugging:

```bash
npm run test:e2e:headed
```

The browser suite uses the local mock data source and must remain independent of Preview and Production data.

## Playwright Setup

Install the Chromium browser once after installing dependencies:

```bash
npx playwright install chromium
```

Playwright starts Nuxt on:

```text
http://127.0.0.1:4173
```

The configuration lives in:

```text
playwright.config.ts
```

Failure artifacts include screenshots, traces, and video when the bundled Playwright browser is used.

## Verification Commands

Fast app verification:

```bash
npm run verify
```

This runs:

1. Unit tests
2. Type checks
3. Production build

API and browser tests:

```bash
npm run test:integration
```

Every automated check:

```bash
npm run verify:full
```

## Continuous Integration

GitHub Actions runs for pull requests and pushes involving `develop`, `preview`, and `production`.

CI performs:

```bash
npm ci
npm run verify
npx playwright install --with-deps chromium
npm run test:integration
```

The Playwright HTML report is uploaded as a workflow artifact so failed browser runs can be inspected.

## Real Supabase Smoke Tests

The local automated suites intentionally do not perform real Supabase writes.

Continue manual Preview testing for:

1. Photo compression with real phone images
2. Private pending-photo uploads
3. Signed admin review URLs
4. Submission approval and photo promotion
5. Rejection and deletion cleanup
6. Current-tag and history updates after approval
7. Email notification behavior
8. Rate limiting against the durable database function

Useful checklists:

```text
docs/architecture/moderation_smoke_test.md
docs/architecture/supabase_submit_smoke_test.md
```

## Test Design Rules

Tests should be:

1. Deterministic
2. Independent
3. Readable
4. Focused on user-visible or API behavior
5. Free of production secrets
6. Safe to retry

Avoid tests that:

1. Depend on execution order
2. Write to Production
3. Assume mutable live data
4. Use arbitrary sleeps instead of observable readiness
5. Assert private implementation details without a behavioral reason

## Pull Request Expectations

Before merging, run:

```bash
npm run verify:full
```

For documentation-only changes, `npm run verify` may be sufficient when the PR clearly states why integration tests were skipped.

Document any manual Preview smoke testing for changes involving Supabase, storage, admin review, or submissions.
