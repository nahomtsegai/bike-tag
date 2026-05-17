# Screen Plan

This document defines the first version screens for the Bike Tag app.

The goal is to keep the first version simple, mobile first, and focused on the core game loop.

## Core Game Loop

1. A rider opens the app
2. The rider sees the current active tag
3. The rider finds the real world location
4. The rider takes a matching bike photo
5. The rider submits the found tag
6. The rider creates the next tag
7. The new tag becomes active
8. Previous tags move into history

## First Version Screens

| Screen | Purpose | Route |
| :-- | :-- | :-- |
| Home | Show the current active tag and main actions | `/` |
| Current Tag Detail | Show details for the active tag | `/tag/current` |
| Submit Tag | Submit a found tag and create the next one | `/submit` |
| Map | Show active and past tag locations | `/map` |
| History | Browse previous tags | `/history` |

## Home Screen

### Purpose

The Home screen should quickly show the player what the current tag is and what they can do next.

### Content

1. Current tag photo
2. Current tag title
3. Location hint
4. Submit find button
5. View map button
6. Recent tag history preview

### Main Actions

1. Open current tag details
2. Submit a found tag
3. View the map
4. View tag history

## Current Tag Detail Screen

### Purpose

The Current Tag Detail screen gives the player more context about the active tag.

### Content

1. Large active tag photo
2. Tag title
3. Hint
4. General location area
5. Rules reminder
6. Found it button

### Main Actions

1. Submit found tag
2. View map
3. Return home

## Submit Tag Screen

### Purpose

The Submit Tag screen lets a rider prove they found the active tag and create the next tag.

### Content

1. Upload proof photo
2. Upload new tag photo
3. Add new tag title
4. Add hint
5. Choose location
6. Submit button

### Main Actions

1. Upload photos
2. Add hint
3. Select location
4. Submit tag

## Map Screen

### Purpose

The Map screen lets riders explore the current tag and past tags.

### Content

1. Map area
2. Active tag marker
3. Past tag markers
4. Selected tag preview card
5. Filter controls

### Main Actions

1. View active tag
2. View past tag
3. Filter tags
4. Open tag details

## History Screen

### Purpose

The History screen lets riders browse previous tags.

### Content

1. List of past tags
2. Tag photo thumbnail
3. Tag title
4. Location area
5. Solved date
6. Optional rider name

### Main Actions

1. Search history
2. Open past tag
3. View tag on map

## Version One Priorities

1. Make the current tag easy to find
2. Make submitting a tag simple
3. Keep navigation clear
4. Use temporary data first
5. Avoid account creation until needed
6. Avoid advanced moderation until needed

## Future Screen Ideas

1. User profile
2. Leaderboard
3. Admin review queue
4. City selector
5. Tag detail pages for past tags
6. Notifications
7. Rules page