
## `docs/architecture/supabase_setup_checklist.md`

```md
# Bike Tag Supabase Setup Checklist

## Purpose

This checklist describes the practical setup steps for moving Bike Tag from browser local storage and the mock server store to Supabase.

The schema plan explains what the backend should look like. This checklist explains the order of setup work and tracks what has already been completed.

## Setup Goals

The first Supabase setup should support:

1. Shared tag data
2. One active tag at a time
3. Found tag history
4. Uploaded tag photos
5. Uploaded match photos
6. Hidden clues
7. Hidden map locations
8. Public found map locations
9. Future authentication
10. Future moderation

## Supabase Project

Create a new Supabase project for Bike Tag.

Recommended project name:

```text
bike_tag