# Bike Tag Testing Strategy

## Purpose

This document explains how Bike Tag should be tested as the app grows.

The goal is to keep tests useful, fast, and focused.

## Current Test Setup

Bike Tag currently uses:

1. Vitest for unit tests
2. Nuxt type checking
3. Nuxt production build checks
4. GitHub Actions CI
5. Manual smoke test docs

The main verification command is:

```bash
npm run verify
```

This runs:

```bash
npm run test:run
npm run typecheck
npm run build
```

## Test File Location

Automated unit tests live in:

```text
tests/unit
```

Unit tests should not live directly inside app, server, or shared source folders.

Reason:

1. Nuxt build should not treat test files as app source code
2. Tests stay easier to find
3. Vitest can target one test folder clearly

## Vitest Config

Vitest is configured by:

```text
vitest.config.ts
```

The test include pattern should stay focused on:

```text
tests/**/*.test.ts
```

## What To Unit Test

Unit tests are best for pure or mostly pure logic.

Good unit test targets:

1. Image validation
2. Map URL validation
3. Submit form parsing
4. Storage URL parsing
5. Small utility functions
6. Error handling branches
7. Data transformation helpers

Examples already covered:

```text
tests/unit/imageValidation.test.ts
tests/unit/mapValidation.test.ts
tests/unit/submitFormData.test.ts
tests/unit/supabaseStorage.test.ts
```

## What To Test In Server Utilities

Server utility tests should cover behavior before external services are called.

Good server utility test targets:

1. Required field validation
2. Input trimming
3. Map URL validation
4. Image file validation
5. MIME type and extension matching
6. Size limit enforcement
7. Storage path parsing
8. Clear error messages

Avoid testing live Supabase calls in unit tests.

Mock or isolate external services when needed.

## What To Smoke Test Manually

Manual smoke tests are still useful for flows that depend on Supabase, browser behavior, admin actions, or real uploaded files.

Use manual smoke testing for:

1. Public submit
2. Admin approval
3. Admin rejection
4. Rejected photo cleanup
5. Supabase Storage behavior
6. Current tag updates
7. Found tag history
8. Hidden map link protection
9. Clue lock behavior

Useful smoke docs:

```text
docs/architecture/moderation_smoke_test.md
docs/architecture/supabase_submit_smoke_test.md
```

## CI Testing

GitHub Actions runs CI for:

1. Pull requests into `develop`
2. Pushes to `develop`

CI runs:

```bash
npm ci
npm run verify
```

A pull request should not be merged unless CI passes.

## Local Testing Before Pull Requests

Before opening or updating a pull request, run:

```bash
npm run verify
```

For focused work, run individual checks:

```bash
npm run test:run
npm run typecheck
npm run build
```

## When To Add Tests

Add or update tests when changing:

1. Validation rules
2. Submit behavior
3. Map URL rules
4. Image upload rules
5. Storage helper behavior
6. Error messages
7. Data parsing
8. Utility functions
9. Security sensitive logic
10. Bug fixes with clear reproduction steps

A good rule:

```text
If the behavior can break silently, add a test.
```

## When Docs Are Enough

Some changes may not need automated tests.

Docs may be enough for:

1. Planning documents
2. README updates
3. Architecture notes
4. Manual checklist updates
5. Non behavioral text changes

Still run:

```bash
npm run verify
```

before merging.

## What Not To Test Yet

Do not add complex automated tests too early for:

1. Full browser flows
2. Real Supabase database writes
3. Real Supabase Storage uploads
4. Admin browser workflow
5. Visual layout details
6. Real mobile device behavior

These should stay manual until the app needs browser automation.

## Future Playwright Coverage

Future end to end tests can use Playwright.

Good future Playwright targets:

1. Current tag page loads
2. Submit review flow works
3. Submit confirmation page appears
4. Tags page search works
5. Rules page loads
6. Settings theme toggle works
7. Admin login token flow works
8. Admin approval flow works with mocked backend
9. Admin rejection flow works with mocked backend

Playwright should be added only when the core app flow stabilizes enough to avoid brittle tests.

## Future API Coverage

Future API tests can cover server routes with mocked dependencies.

Good future API test targets:

1. `GET /api/tags/current`
2. `GET /api/tags`
3. `GET /api/tags/:id`
4. `POST /api/tags/submit`
5. Admin approval route
6. Admin rejection route

API tests should avoid real Supabase calls unless they are explicitly integration tests.

## Integration Test Policy

Integration tests are useful later, but they need more setup.

Before adding Supabase integration tests, decide:

1. Test database strategy
2. Test storage bucket strategy
3. Seed data approach
4. Cleanup strategy
5. CI secret handling
6. Whether tests run locally, in CI, or both

Until then, keep Supabase behavior covered by manual smoke tests and focused unit tests.

## Test Naming

Use descriptive test names.

Good examples:

```text
rejects invalid Google Maps URLs
rejects oversized photos
returns the storage path from a Supabase public URL
parses a valid submit form payload
```

Avoid vague names:

```text
works
test validation
submit test
```

## Test Quality Guidelines

Good tests should be:

1. Fast
2. Focused
3. Easy to read
4. Independent
5. Deterministic
6. Clear about expected behavior

Avoid tests that:

1. Depend on test order
2. Call live external services
3. Need secret values
4. Rely on current time without control
5. Assert implementation details instead of behavior

## Pull Request Expectations

Pull requests should include testing notes.

Mention:

1. Whether `npm run verify` passed
2. Whether manual smoke testing was performed
3. Whether screenshots are included for UI changes
4. Whether docs were updated
5. Any testing gaps or known risks

## Done Criteria

Testing strategy is working when:

1. Unit tests cover important utility logic
2. CI runs on pull requests into `develop`
3. Developers run `npm run verify` before opening PRs
4. Manual smoke docs are used for Supabase and moderation flows
5. New behavior includes tests when practical
6. Testing gaps are documented in pull requests