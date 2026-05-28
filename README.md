# Bike Tag

Bike Tag is a location based photo tagging game for cyclists.

## Live Site

Production:

```text
https://louisvillebiketag.vercel.app
```

Preview is hosted on Vercel and protected by Vercel authentication.

## Branch Strategy

Development work happens on `develop`.

Preview ready work is promoted to `preview`.

Production ready code is promoted to `production`.

## Environment Overview

`develop` is used for local development and feature work.

`preview` deploys to the protected Vercel Preview environment and uses the Preview Supabase project.

`production` deploys to the public Vercel Production environment and uses the Production Supabase project.

## MVP Goal

Build a simple playable version where a player can:

1. View the current tag
2. See a clue or location hint
3. Submit a new tag photo
4. Add basic location information
5. View previous tags

## Tech Stack

1. Vue 3
2. TypeScript
3. Nuxt
4. GitHub
5. Supabase
6. Vercel
7. Vitest
8. GitHub Actions

## Local Development

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm run dev
```

Start the app for access from another device on the same network:

```bash
npm run dev-local
```

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

Run the full local verification command:

```bash
npm run verify
```

The verification command runs:

1. Unit tests
2. Type checks
3. Production build

Use this before opening or updating a pull request.

## Continuous Integration

GitHub Actions runs the CI workflow for:

1. Pull requests into `develop`
2. Pushes to `develop`

The CI workflow runs:

```bash
npm ci
npm run verify
```

## Promotion Flow

Feature branches are merged into `develop`.

When `develop` is stable, promote it to `preview`.

When `preview` has been tested, promote it to `production`.

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