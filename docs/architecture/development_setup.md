# Bike Tag Development Setup

## Purpose

This guide explains how to set up Bike Tag for local development.

Use this when setting up the project for the first time or when troubleshooting local environment issues.

## Requirements

Recommended tools:

1. Node 22
2. npm
3. Git
4. A code editor
5. Supabase account for Supabase mode

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

## Environment File

Create a local environment file:

```bash
touch .env
```

Do not commit `.env`.

## Mock Mode Setup

Mock mode is the recommended default for normal local development.

Add this to `.env`:

```text
NUXT_TAG_DATA_SOURCE=mock
```

Mock mode behavior:

1. Uses local server mock data
2. Does not require Supabase
3. Resets when the dev server restarts
4. Supports quick UI development

Start the app:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Local Network Development

To test from another device on the same network, start the app with:

```bash
npm run dev-local
```

Then open the local network URL shown in the terminal from your phone or another device.

## Supabase Mode Setup

Supabase mode is used when testing real database, storage, submit, and moderation behavior.

Add these values to `.env`:

```text
NUXT_TAG_DATA_SOURCE=supabase
NUXT_SUPABASE_URL=your-supabase-project-url
NUXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
NUXT_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NUXT_SUPABASE_STORAGE_BUCKET=bike_tag_photos
NUXT_ADMIN_API_TOKEN=your-local-admin-token
```

Important:

1. Keep the service role key server only
2. Do not use `NUXT_PUBLIC` for the service role key
3. Do not commit `.env`
4. Use a long random admin token outside local testing

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

## Mock Mode Is Not Resetting

Restart the dev server.

Mock mode uses in memory server data, so restarting the dev server resets the mock store.

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