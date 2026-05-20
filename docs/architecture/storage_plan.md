# Bike Tag Storage Plan

## Purpose

Bike Tag currently stores game data in browser local storage. That works for prototyping, but it has important limits.

Local storage is useful for early testing because it is simple and does not require a backend. It is not enough for a real shared game because each browser has its own private copy of the data.

This document describes the future storage direction for tags, photos, hidden clues, hidden map locations, and public game history.

## Current Prototype Storage

The app currently stores tags in browser local storage.

Stored data includes:

1. Current active tag
2. Found tag history
3. Tag titles
4. Clues
5. Public map links for found tags
6. Hidden map links for active tags
7. Uploaded image data
8. Created dates
9. Rider display names

This is good for local development, but it should not be treated as production storage.

## Current Limits

### Local only

Submitted tags only exist in the browser where they were created.

A rider using another device will not see those submissions.

### Image storage is fragile

Images are converted and stored locally. Browser storage can fill up quickly, especially on mobile.

### No shared source of truth

There is no central game state. Multiple users can create different versions of the game.

### No moderation

Anyone using the prototype can add any title, clue, map link, or image locally.

### No authentication

The app accepts a rider name as text. It does not verify identity.

## Future Storage Goals

A production version should support:

1. Shared current tag
2. Shared tag history
3. Reliable photo storage
4. Hidden clue protection
5. Hidden map location protection
6. Public found map links
7. Basic moderation tools
8. Future user accounts
9. Auditable tag submissions
10. Safe reset and recovery workflows

## Recommended Data Model

### Tag

A tag represents one round of the game.

```ts
type Tag = {
  id: string
  title: string
  clue: string
  imageUrl: string
  locationMapUrl?: string
  hiddenLocationMapUrl?: string
  foundBy: string
  createdAtIso: string
  foundAtIso?: string
  status: 'active' | 'found'
}
```

### Field Meaning

1. `id`

   Unique tag id.

   Public while active: yes

   Public after found: yes

2. `title`

   Tag title.

   Public while active: yes

   Public after found: yes

3. `clue`

   Written clue.

   Public while active: only after unlock time

   Public after found: yes

4. `imageUrl`

   Tag photo.

   Public while active: yes

   Public after found: yes

5. `locationMapUrl`

   Public found location.

   Public while active: no

   Public after found: yes

6. `hiddenLocationMapUrl`

   Hidden next tag location.

   Public while active: no

   Public after found: no

7. `foundBy`

   Rider display name.

   Public while active: yes

   Public after found: yes

8. `createdAtIso`

   When the tag became active.

   Public while active: yes

   Public after found: yes

9. `foundAtIso`

   When the tag was found.

   Public while active: no

   Public after found: yes

10. `status`

   Whether the tag is active or found.

   Public while active: yes

   Public after found: yes

## Hidden Clue Behavior

The clue should be saved when a rider creates the next tag.

The clue should not be shown immediately.

The current rule is:

```text
A clue unlocks after the active tag has been live for 5 days.
```

The backend should calculate clue visibility from `createdAtIso`.

The frontend can display the countdown, but the backend should be the final authority for whether the clue is visible.

## Hidden Location Behavior

The hidden map location is sensitive game data.

While a tag is active:

1. The hidden location map link must not be shown in the frontend
2. The hidden location map link should not be returned by public APIs
3. Only trusted server logic should access it

After a tag is found:

1. The submitted found map link becomes public as `locationMapUrl`
2. The original hidden map link can remain private
3. The public history should show only the found map link

## Recommended Backend Direction

Bike Tag should use Supabase for the first production backend.

Supabase is a good fit because the app needs a practical shared data layer without adding unnecessary cloud complexity.

Supabase gives us:

1. Postgres for tag records
2. Storage for bike tag photos
3. Auth options when we need them later
4. Row level security when we need stronger access rules
5. A useful dashboard for inspecting prototype data
6. A simpler setup than managing custom cloud infrastructure

This project does not currently need AWS scale or infrastructure complexity. The goal is to build a reliable shared game first, then only add heavier infrastructure if the product actually needs it.

## Recommended Photo Storage

Photos should not live in browser local storage in production.

Bike Tag should use Supabase Storage for uploaded photos.

Supabase Storage is the recommended first path because it keeps the database, auth, and file storage in the same platform.

The app should store photo files in Supabase Storage and save the public photo URL on the tag record.

Recommended storage buckets:

1. Tag photos
2. Match photos

The first implementation can use one bucket if that keeps setup simpler.

## Suggested API Shape

### Get current tag

```text
GET /api/tags/current
```

Returns the active tag.

Should include:

1. id
2. title
3. imageUrl
4. foundBy
5. createdAtIso
6. status
7. clue only if unlocked
8. clueUnlocksAtIso
9. location visibility status

Should not include:

1. hiddenLocationMapUrl

### Get found tags

```text
GET /api/tags
```

Returns found tag history.

Should include:

1. id
2. title
3. clue
4. imageUrl
5. locationMapUrl
6. foundBy
7. createdAtIso
8. foundAtIso
9. status

### Submit tag

```text
POST /api/tags/submit
```

Accepts:

1. riderName
2. foundLocationMapUrl
3. matchPhoto
4. nextTitle
5. nextClue
6. nextHiddenLocationMapUrl
7. nextPhoto

Server behavior:

1. Validate found map link
2. Validate hidden map link
3. Upload photos to Supabase Storage
4. Mark current tag as found
5. Create new active tag
6. Store hidden clue and hidden map location safely
7. Return the new active tag summary

## Submission Flow

Production submit flow should be:

1. User fills out form
2. User reviews submission
3. Frontend sends data to API
4. API validates data
5. API uploads images to Supabase Storage
6. API updates current tag to found
7. API creates next active tag
8. Frontend routes user to the new current tag

## Basic Validation Rules

### Rider name

1. Required
2. Trimmed
3. Reasonable max length

Suggested max:

```text
50 characters
```

### Map links

Allowed map links:

1. `https://www.google.com/maps`
2. `https://maps.google.com`
3. `https://maps.app.goo.gl`

### Images

Allowed image types:

1. jpg
2. jpeg
3. png
4. webp

Suggested upload size limit:

```text
8 MB
```

### Title

1. Required
2. Suggested max length: 80 characters

### Clue

1. Required
2. Suggested max length: 500 characters

## Security Notes

The backend must not rely only on frontend hiding.

Hidden fields should be protected at the API level.

Public API responses should never include `hiddenLocationMapUrl`.

Clue visibility should be calculated on the server.

Map links should be validated on the server.

Image uploads should validate type and size on the server.

## Future Authentication

Authentication is not required for the early prototype.

Later options:

1. Anonymous rider names
2. Magic link login
3. OAuth login
4. Admin only moderation login

Recommended early production approach:

```text
Anonymous rider names plus admin moderation
```

Recommended later approach:

```text
Supabase Auth with magic links
```

## Future Moderation

Moderation tools may include:

1. Hide a tag
2. Delete an image
3. Edit tag title
4. Edit clue
5. Reset active tag
6. Restore sample data
7. View submission history

## Suggested Implementation Phases

### Phase 1: Keep local prototype stable

1. Maintain local storage versioning
2. Keep image size validation
3. Keep map link validation
4. Keep reset local data setting

### Phase 2: Add Supabase read APIs

1. Create Supabase project
2. Create database schema
3. Seed sample tags
4. Add API for current tag
5. Add API for found tags
6. Replace local reads with API reads

### Phase 3: Add Supabase Storage

1. Create storage bucket
2. Upload images through API
3. Store image URLs in Postgres
4. Remove local image storage reliance

### Phase 4: Add submit API

1. Submit found tag
2. Create next tag
3. Protect hidden location
4. Protect hidden clue until unlock

### Phase 5: Add moderation and auth

1. Admin access
2. Tag management
3. Safer reset workflows
4. User identity options

## Recommended Next Technical Step

The next technical step should be:

```text
Create Supabase schema planning document
```

That document should define tables, columns, indexes, storage buckets, access rules, and visibility rules before writing backend code.