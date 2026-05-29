# Bike Tag Development Setup

## Purpose

This guide explains how to set up Bike Tag for local development, protected preview testing, and public production deployment.

Use this when setting up the project for the first time, switching local environments, promoting code, or troubleshooting hosted deployments.

## Requirements

Recommended tools:

1. Node 22
2. npm
3. Git
4. A code editor
5. Supabase account
6. Vercel account

Check your Node version:

```bash
node --version
```

Check your npm version:

```bash
npm --version
```

## Clone The Repository

Clone the repository:

```bash
git clone git@github.com:nahomtsegai/bike-tag.git
cd bike-tag
```

## Install Dependencies

Install project dependencies:

```bash
npm install
```

This also runs:

```bash
nuxt prepare
```

through the `postinstall` script.

## Branch Strategy

Bike Tag uses three long lived branches:

1. `develop`
2. `preview`
3. `production`

`develop` is used for local development and feature work.

`preview` is used for protected hosted testing in Vercel.

`production` is used for the public production site.

## Environment Mapping

`develop` maps to local development.

`preview` maps to the Vercel Preview environment and the Preview Supabase project.

`production` maps to the Vercel Production environment and the Production Supabase project.

## Hosted URLs

Production:

```text
https://louisvillebiketag.vercel.app
```

Preview is hosted on Vercel and protected by Vercel authentication.

## Local Environment File

Create a local environment file from the example:

```bash
cp .env.example .env
```

Do not commit `.env`.

## Local Environment Files

Local environment files can be kept in this folder:

```text
.envs
```

Recommended local files:

```text
.envs/preview.env
.envs/production.env
```

These files should not be committed.

Use `.envs/preview.env` for local testing against the Preview Supabase project.

Use `.envs/production.env` only when intentionally testing against the Production Supabase project.

## Preview Environment Setup

Create the local Preview env file:

```bash
mkdir -p .envs
cp .env.example .envs/preview.env
```

Fill in `.envs/preview.env` with the Preview Supabase values:

```text
NUXT_TAG_DATA_SOURCE=supabase
NUXT_SUPABASE_URL=your-preview-supabase-project-url
NUXT_PUBLIC_SUPABASE_ANON_KEY=your-preview-anon-key
NUXT_SUPABASE_SERVICE_ROLE_KEY=your-preview-service-role-key
NUXT_SUPABASE_STORAGE_BUCKET=bike_tag_photos
NUXT_ADMIN_API_TOKEN=your-preview-admin-token
```

Copy Preview values into the active local `.env` file:

```bash
npm run env:preview
```

Start the app:

```bash
npm run dev
```

## Production Environment Setup

Create the local Production env file:

```bash
mkdir -p .envs
cp .env.example .envs/production.env
```

Fill in `.envs/production.env` with the Production Supabase values:

```text
NUXT_TAG_DATA_SOURCE=supabase
NUXT_SUPABASE_URL=your-production-supabase-project-url
NUXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
NUXT_SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
NUXT_SUPABASE_STORAGE_BUCKET=bike_tag_photos
NUXT_ADMIN_API_TOKEN=your-production-admin-token
```

Copy Production values into the active local `.env` file:

```bash
npm run env:production
```

Start the app:

```bash
npm run dev
```

Use the Production environment locally only when intentionally testing live production behavior.

## Local Network Development

To test from another device on the same network, start the app with:

```bash
npm run dev-local
```

Then open the local network URL shown in the terminal from your phone or another device.

## Supabase Notes

Supabase mode is used when testing real database, storage, submit, and moderation behavior.

Important:

1. Keep the service role key server only
2. Do not use `NUXT_PUBLIC` for the service role key
3. Do not commit `.env`
4. Do not commit files inside `.envs` that end with `.env`
5. Use a long random admin token outside local testing

## Supabase Environments

Bike Tag uses separate Supabase projects for hosted environments.

Preview uses the Preview Supabase project.

Production uses the Production Supabase project.

The Vercel Preview environment should point to the Preview Supabase project.

The Vercel Production environment should point to the Production Supabase project.

## Vercel Environment Variables

Vercel stores environment variables separately per environment.

Required variables:

```text
NUXT_TAG_DATA_SOURCE
NUXT_SUPABASE_URL
NUXT_PUBLIC_SUPABASE_ANON_KEY
NUXT_SUPABASE_SERVICE_ROLE_KEY
NUXT_SUPABASE_STORAGE_BUCKET
NUXT_ADMIN_API_TOKEN
```

Preview and Production should use the same variable names, but the values should point to their matching Supabase projects.

## Vercel Deployment Notes

After changing Vercel environment variables, redeploy the matching environment.

When redeploying after environment variable changes, avoid using the existing build cache.

Preview deployments should be redeployed from the `preview` branch.

Production deployments should be redeployed from the `production` branch.

## Local Development Flow

Create feature branches from `develop`:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/example_feature
```

After work is complete, open a pull request into `develop`.

Before opening or updating a pull request, run:

```bash
npm run verify
```

## Promote To Preview

After `develop` is stable, promote it to `preview`:

```bash
git checkout preview
git pull origin preview
git merge develop
git push origin preview
```

Pushing to `preview` creates a protected Vercel Preview deployment.

## Promote To Production

After `preview` has been tested, promote it to `production`:

```bash
git checkout production
git pull origin production
git merge preview
git push origin production
```

Pushing to `production` creates a public Vercel Production deployment.

## Supabase Database Setup

Apply Supabase migrations before using Supabase mode.

Migrations live in:

```text
supabase/migrations
```

Useful setup docs:

```text
docs/architecture/supabase_setup_checklist.md
docs/architecture/storage_plan.md
docs/architecture/submission_moderation_plan.md
```

## Run The App

Start local development:

```bash
npm run dev
```

Start local development for network access:

```bash
npm run dev-local
```

## Run Verification

Before opening or updating a pull request, run:

```bash
npm run verify
```

This runs:

```bash
npm run test:run
npm run typecheck
npm run build
```

## Run Individual Checks

Run unit tests:

```bash
npm run test:run
```

Run type checks:

```bash
npm run typecheck
```

Run production build:

```bash
npm run build
```

## Common Troubleshooting

## Nuxt Generated Files Are Missing

If you see errors about missing `.nuxt` files, run:

```bash
npm run postinstall
```

Then run verification again:

```bash
npm run verify
```

## Dependencies Feel Out Of Sync

If local dependencies seem stale, reinstall:

```bash
rm -rf node_modules
npm install
```

Then run:

```bash
npm run verify
```

## Build Works Locally But CI Fails

Make sure local checks use the same command as CI:

```bash
npm run verify
```

CI uses:

```bash
npm ci
npm run verify
```

## Supabase Mode Fails Locally

Check:

1. `.env` values are present
2. `NUXT_TAG_DATA_SOURCE=supabase`
3. Supabase migrations have been applied
4. Storage bucket exists
5. Service role key is valid
6. Admin token is set for admin routes

## Hosted Preview Or Production Cannot Load Tags

Check:

1. `NUXT_TAG_DATA_SOURCE=supabase`
2. `NUXT_SUPABASE_URL` points to the correct Supabase project
3. `NUXT_SUPABASE_SERVICE_ROLE_KEY` is the correct service role key
4. The `tags` table exists
5. The service role has access to the `tags` table
6. The deployment was redeployed after environment variable changes

## Admin Login Fails

Check:

1. `NUXT_ADMIN_API_TOKEN` exists in the matching Vercel environment
2. The value matches the token entered in the admin page
3. The deployment was redeployed after environment variable changes
4. The correct deployment environment was redeployed

## Useful Docs

Architecture docs live in:

```text
docs/architecture
```

Helpful docs:

1. `docs/architecture/supabase_setup_checklist.md`
2. `docs/architecture/supabase_submit_smoke_test.md`
3. `docs/architecture/submission_moderation_plan.md`
4. `docs/architecture/moderation_smoke_test.md`
5. `docs/architecture/storage_plan.md`
6. `docs/architecture/security_hardening_plan.md`