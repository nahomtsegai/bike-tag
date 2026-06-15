# Bike Tag

Bike Tag is a location-based photo tagging game for cyclists in Louisville, Kentucky.

Players find the current tag, submit a matching photo, and create the next hidden location for the community to discover. Submissions are reviewed by an admin before they become part of the active game.

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

## Features

- Current tag page with active tag details
- Tag submission workflow with photo uploads
- Device-captured location support
- Admin submission review workflow
- Approved/rejected/pending submission states
- Previous tags list with search and pagination
- Interactive completed-tags map
- Clue locking and automatic clue reveal timing
- Light, dark, and system theme settings
- Responsive mobile-first layout

## Tech Stack

- Nuxt 3
- Vue 3
- TypeScript
- Supabase
- Vercel
- Vitest
- Playwright
- GitHub Actions

## Branch Strategy

| Branch | Purpose | Deployment |
| --- | --- | --- |
| `develop` | Active development and feature PRs | Development workflow |
| `preview` | Preview-ready release candidate | Protected Vercel Preview environment |
| `production` | Production-ready code | Public Vercel Production environment |

Feature branches should be created from `develop` and merged back into `develop` through pull requests.

## Environment Overview

`develop` is used for local development and feature work.

`preview` deploys to the protected Vercel Preview environment and uses the Preview Supabase project.

`production` deploys to the public Vercel Production environment and uses the Production Supabase project.

Keep Preview and Production environment variables separate in Vercel and Supabase.

## Local Development

### Requirements

- Node.js 22
- npm
- Supabase project credentials
- Vercel CLI, optional but recommended for environment management

### Setup

Install dependencies and the Playwright browser:

```bash
npm install
npx playwright install chromium
```

Create a local environment file:

```bash
cp .env.example .env
```

Fill in the local `.env` values for your Supabase project and storage bucket.

Start the app:

```bash
npm run dev
```

Start the app for access from another device on the same network:

```bash
npm run dev-local
```

## Environment Variables

The app expects the following environment variables:

```bash
NUXT_SUPABASE_URL=
NUXT_PUBLIC_SUPABASE_ANON_KEY=
NUXT_SUPABASE_SERVICE_ROLE_KEY=
NUXT_SUPABASE_STORAGE_BUCKET=
```

Do not commit real `.env` files or secret values.

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

Run the standard app verification command:

```bash
npm run verify
```

This runs unit tests, type checks, and a production build. To run every automated check, use:

```bash
npm run verify:full
```

The Playwright suites start a local Nuxt server on port `4173` with the mock data source. They do not write to Preview or Production.

## Continuous Integration

GitHub Actions runs the CI workflow for:

1. Pull requests into `develop`
2. Pushes to `develop`

The CI workflow runs:

```bash
npm ci
npm run verify
npx playwright install --with-deps chromium
npm run test:integration
```

Failed browser runs upload a Playwright report as a GitHub Actions artifact.

## Admin Workflow

Submissions are created as pending records in Supabase. Admin users review pending submissions from the admin submissions page and can approve or reject them.

When a submission is approved:

1. The submitted match photo confirms the current tag.
2. The next tag photo and clue become the new active tag.
3. The completed tag becomes visible in the tag history and map.

## Promotion Flow

Feature branches are merged into `develop`.

When `develop` is stable, promote it to `preview`.

When `preview` has been tested, promote it to `production`.

Promote to Preview:

```bash
git checkout preview
git pull origin preview
git merge develop
git push origin preview
```

Promote to Production:

```bash
git checkout production
git pull origin production
git merge preview
git push origin production
```

## Project Docs

Architecture and setup docs live in `docs/architecture`.

Useful docs:

1. [Submission moderation plan](docs/architecture/submission_moderation_plan.md)
2. [Moderation smoke test](docs/architecture/moderation_smoke_test.md)
3. [Admin review workflow](docs/architecture/admin_review_workflow.md)
4. [Supabase setup checklist](docs/architecture/supabase_setup_checklist.md)
5. [Supabase submit smoke test](docs/architecture/supabase_submit_smoke_test.md)
6. [Development setup](docs/architecture/development_setup.md)
7. [Testing strategy](docs/architecture/testing_strategy.md)
8. [Roadmap](docs/architecture/roadmap.md)
