# Bike Tag Supabase Schema Plan

## Purpose

This document defines the first Supabase database and storage plan for Bike Tag.

The goal is to move from browser local storage to a shared backend while keeping the first production version simple.

Supabase will provide:

1. Postgres for tag records
2. Supabase Storage for uploaded photos
3. Future auth support
4. Future moderation support
5. Row level security when needed

## Design Goals

The first Supabase version should support:

1. One active tag at a time
2. A history of found tags
3. Uploaded tag photos
4. Uploaded matching photos
5. Hidden clues
6. Hidden map locations
7. Public found map locations
8. Basic moderation later
9. Future user identity later

## Initial Tables

The first version can start with one main table:

```text
tags