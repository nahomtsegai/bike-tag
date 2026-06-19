# Bike Tag

Bike Tag is a location-based photo tagging game for cyclists in Louisville, Kentucky.

Players find the current tag, submit a matching photo, and create the next hidden location for the community to discover. Submissions are reviewed by an authenticated admin before they affect the live game.

## Live Sites

Production:

```text
https://louisvillebiketag.vercel.app
```

Preview:

```text
https://louisvillebiketagpreview.vercel.app
```

Preview is hosted on Vercel and protected by Vercel authentication.

## Current Features

### Public game

- Current tag page with active-tag details and clue reveal timing
- Public tag history with search, pagination, and tag detail pages
- Interactive map of completed Bike Tag locations
- Responsive light, dark, and system themes

### Submission workflow

- Match-photo and next-tag submission flow
- Device-captured location support
- JPEG, PNG, HEIC, and HEIF source-photo handling
- Client-side image preparation and compression before upload
- Server-side image, location, and form validation
- Durable submit rate limiting
- Active-tag binding that rejects stale submissions
- Submission confirmation pages with stable reference IDs
- Admin email notifications through Resend

### Admin and moderation

- Supabase Auth email-and-password sign-in
- Admin authorization through the `admin_users` table
- Searchable, filterable, paginated submission review
- Submission summary counts and detailed photo review
- Private pending-photo storage with signed admin URLs
- Approval, rejection, archive, and deletion workflows
- Automatic superseding of competing pending submissions after approval
- Admin activity and audit-history page

### Operations and safety

- Published and private pending-photo buckets
- Photo promotion and cleanup during moderation
- Scheduled observation-only storage cleanup scans
- Supabase migration-backed database tests in CI
- Migration parity tooling for hosted environments
- Structured submit diagnostics and audit events
- Protected promotion through Development, Preview, and Production

## Tech Stack

- Nuxt 4
- Vue 3
- TypeScript
- Supabase
- Vercel
- Resend
- Vitest
- Playwright
- GitHub Actions

## Branch and Environment Strategy

| Branch | Purpose | Deployment |
| --- | --- | --- |
| `develop` | Active development and feature PRs | Vercel Development deployments |
| `preview` | Verified release candidate | Protected Vercel Preview environment |
| `production` | Production-ready code | Public Vercel Production environment |

Feature and fix branches start from `develop` and return through a pull request.

Promotions also use pull requests:

```text
develop -> preview -> production
```

Each long-lived branch has its own required CI checks and Vercel deployment. Preview and Production use separate Supabase projects and environment values.

## Local Development

### Requirements

- Node.js 22
- npm
- Docker for local Supabase-backed tests
- Supabase project credentials for live local development
- Vercel CLI, optional but recommended for environment management

### Setup

Install the locked dependencies and the Playwright browser:

```bash
npm ci
npx playwright install chromium
```

`npm ci` installs the dependency versions recorded in `package-lock.json`.

Create a local environment file:

```bash
cp .env.example .env
```

Fill in the local values, then start the app:

```bash
npm run dev
```

Start the app for access from another device on the same network:

```bash
npm run dev-local
```

## Environment Variables

`.env.example` is the source of truth for local variable names. The main groups are:

- Data-source selection
- Supabase URL and API keys
- Published and private pending-photo bucket names
- Admin signed-photo URL lifetime
- Submit rate-limit settings
- Resend notification settings
- Public site URL
- Supabase database password for hosted migration checks

Do not commit real `.env` files, database passwords, service-role keys, or notification credentials.

Environment helper scripts copy an environment template into `.env`:

```bash
npm run env:development
npm run env:preview
npm run env:production
```

Review the destination file before starting the app, especially when switching between Preview and Production.

## Testing and Verification

Run unit tests:

```bash
npm run test:run
```

Run type checks:

```bash
npm run typecheck
```

Build the app:

```bash
npm run build
```

Run API tests:

```bash
npm run test:api
```

Run browser end-to-end tests:

```bash
npm run test:e2e
```

Run API and browser tests together:

```bash
npm run test:integration
```

Run the local Supabase-backed submit and admin workflow:

```bash
npm run test:e2e:workflow
```

Run the standard verification command:

```bash
npm run verify
```

`verify` runs unit tests, type checks, a production build, and migration-backed database tests when running in CI. The database step safely skips outside CI.

Run every automated check:

```bash
npm run verify:full
```

Check hosted Supabase migration parity when the required environment values are available:

```bash
npm run check:migrations:hosted
```

The API and standard browser suites use the mock data source and do not write to Preview or Production. The workflow suite starts an isolated local Supabase stack.

## Continuous Integration

GitHub Actions runs for pull requests and pushes involving:

- `develop`
- `preview`
- `production`

The CI workflow performs:

```bash
npm ci
npm run verify
npx playwright install --with-deps chromium
npm run test:integration
npm run test:e2e:workflow
```

The workflow uploads the Playwright report, verification log, workflow log, and database-test output as an artifact for inspection.

## Admin Workflow

The protected admin pages are:

```text
/admin/submissions
/admin/activity
```

Admins sign in with an approved Supabase Auth account. The server then confirms the account exists in `public.admin_users` before allowing access.

During approval:

1. The selected submission is locked and validated against the active tag.
2. The current tag is completed with the rider's match photo and found location.
3. The next tag photo is promoted into published storage.
4. The submitted title, clue, photo, and location become the new active tag.
5. Other pending submissions for the completed tag become superseded.
6. The action is recorded in admin audit history.

## Promotion Flow

1. Merge a feature or fix PR into `develop` after CI passes.
2. Open a promotion PR from `develop` to `preview`.
3. Confirm Preview CI and the protected Vercel deployment.
4. Run any required Preview smoke tests.
5. Open a promotion PR from `preview` to `production`.
6. Confirm Production CI, deployment readiness, and live smoke checks.

Do not bypass protected branches with direct pushes or local merge-only promotion commands.

## Project Documentation

Architecture, operations, setup, and smoke-test docs live in `docs/architecture`.

Useful starting points:

1. [Roadmap](docs/architecture/roadmap.md)
2. [Development setup](docs/architecture/development_setup.md)
3. [Testing strategy](docs/architecture/testing_strategy.md)
4. [Admin review workflow](docs/architecture/admin_review_workflow.md)
5. [Moderation smoke test](docs/architecture/moderation_smoke_test.md)
6. [Supabase setup checklist](docs/architecture/supabase_setup_checklist.md)
7. [Supabase submit smoke test](docs/architecture/supabase_submit_smoke_test.md)
8. [Storage plan](docs/architecture/storage_plan.md)
9. [Storage cleanup dry run](docs/architecture/storage_cleanup_dry_run.md)
10. [Security hardening plan](docs/architecture/security_hardening_plan.md)
