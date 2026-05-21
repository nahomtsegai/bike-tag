# Bike Tag Supabase Read Smoke Test

## Purpose

This checklist verifies that Bike Tag can read tag data from Supabase when `NUXT_TAG_DATA_SOURCE` is set to `supabase`.

Mock mode remains the default for normal local development. Supabase mode should only be used after the Supabase project, migrations, seed data, permissions, and local environment variables are ready.

## What This Test Covers

This smoke test verifies:

1. The app can switch from mock mode to Supabase mode
2. The server can read Supabase runtime config values
3. The current tag API can read from Supabase
4. The found tags API can read from Supabase
5. The app pages can render Supabase tag data
6. Hidden map URLs are not exposed in API responses
7. Locked clues are not exposed before unlock time
8. The app can switch back to mock mode

## Prerequisites

Before starting, confirm that these files exist:

```text
supabase/migrations/001_create_tags_table.sql
supabase/migrations/002_create_storage_bucket.sql