# Bike Tag Supabase Read Mode Notes

## Purpose

Bike Tag can now choose where tag read APIs get their data.

The current supported data sources are:

1. Mock server store
2. Supabase

Mock mode remains the default. Supabase mode is available for local testing once the Supabase project, migrations, seed data, and environment variables are ready.

## Current Default Mode

The app currently defaults to:

```text
mock