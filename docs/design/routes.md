# Routes

This document defines the initial routing plan for the Bike Tag app.

The app should start with a simple route structure that supports the core game loop without overcomplicating the first version.

## Route List

| Route | Screen | Purpose |
| :-- | :-- | :-- |
| `/` | Home | Show the current active tag |
| `/tag/current` | Current Tag Detail | Show details for the current active tag |
| `/submit` | Submit Tag | Submit a found tag and create the next tag |
| `/map` | Map | Show active and past tag locations |
| `/history` | History | Browse previous tags |

## Route Details

## `/`

### Screen

Home

### Purpose

The Home route is the main landing screen for the app.

It should show the current active Bike Tag and guide the rider toward the next action.

### Primary Content

1. Current tag image
2. Tag title
3. Hint
4. Main action buttons
5. Recent tags preview

### Primary Actions

1. Go to `/tag/current`
2. Go to `/submit`
3. Go to `/map`
4. Go to `/history`

## `/tag/current`

### Screen

Current Tag Detail

### Purpose

This route shows the current active tag in more detail.

### Primary Content

1. Large tag image
2. Tag title
3. Hint
4. General location area
5. Rules reminder

### Primary Actions

1. Go to `/submit`
2. Go to `/map`
3. Return to `/`

## `/submit`

### Screen

Submit Tag

### Purpose

This route lets a rider submit proof that they found the active tag and create the next one.

### Primary Content

1. Proof photo upload
2. New tag photo upload
3. Tag title field
4. Hint field
5. Location selector
6. Submit button

### Primary Actions

1. Upload proof photo
2. Upload new tag photo
3. Add hint
4. Select location
5. Submit tag

## `/map`

### Screen

Map

### Purpose

This route shows the active tag and previous tags on a map.

### Primary Content

1. Map
2. Active tag marker
3. Past tag markers
4. Selected tag preview
5. Filter controls

### Primary Actions

1. Select a tag
2. Open current tag
3. Open past tag
4. Filter visible tags

## `/history`

### Screen

History

### Purpose

This route lists past tags so players can browse completed challenges.

### Primary Content

1. Past tag list
2. Tag thumbnail
3. Tag title
4. General location
5. Solved date

### Primary Actions

1. Open past tag
2. Search past tags
3. View tag on map

## Possible Future Routes

| Route | Purpose |
| :-- | :-- |
| `/tag/:id` | Show a specific past tag |
| `/rules` | Show game rules |
| `/profile` | Show rider profile |
| `/leaderboard` | Show player standings |
| `/admin/review` | Review submitted tags |
| `/cities` | Choose a city or game area |

## Routing Notes

1. Start with simple static routes
2. Add dynamic tag routes later
3. Avoid auth routes in version one unless they become necessary
4. Keep the first navigation model simple
5. Prefer mobile first page layouts