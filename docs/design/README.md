# Design

This folder contains early design planning for the Bike Tag app.

These documents are not production app code. They are here to help define the app flow, screen structure, routes, and first version decisions before building the actual Nuxt pages.

## Purpose

The purpose of this folder is to keep design decisions organized while the app is still being planned.

The design docs should help answer questions like:

1. What screens does the app need?
2. What should each screen contain?
3. What routes should exist?
4. What should version one include?
5. What should wait until a later version?

## Current Files

| File | Purpose |
| :-- | :-- |
| `wireframes.md` | Describes the first pass wireframes for the main app screens |
| `screen_plan.md` | Defines each screen, its purpose, content, and main actions |
| `routes.md` | Defines the initial app routes and what each route should show |

## Design Goals

The first version of Bike Tag should be simple, mobile first, and easy to understand.

The app should make it easy for a rider to:

1. See the current active tag
2. Understand the hint
3. Find the real world location
4. Submit a matching bike photo
5. Create the next tag
6. Browse previous tags
7. View tags on a map

## Version One Screens

| Screen | Purpose |
| :-- | :-- |
| Home | Show the current active tag and main actions |
| Current Tag Detail | Show more information about the active tag |
| Submit Tag | Allow a rider to submit a found tag and create the next one |
| Map | Show active and previous tag locations |
| History | Show previous completed tags |

## Design Principles

1. Start mobile first
2. Keep the core game loop clear
3. Make the primary action obvious on each screen
4. Avoid unnecessary features in the first version
5. Prefer simple layouts that are easy to build in Nuxt
6. Use temporary data first, then replace it with real data later
7. Keep future features documented, but do not build them too early

## Core Game Loop

The main Bike Tag flow is:

1. A rider opens the app
2. The rider views the current active tag
3. The rider uses the photo and hint to find the location
4. The rider takes a matching photo with their bike
5. The rider submits the found tag
6. The rider creates the next tag
7. The new tag becomes active
8. The previous tag moves into history

## Open Questions

These decisions do not need to be solved immediately, but they should be tracked.

1. Should users need accounts in version one?
2. Should submissions require approval before becoming active?
3. Should the map show exact coordinates or approximate areas?
4. Should exact tag locations stay hidden until a tag is solved?
5. Should the app support multiple cities later?
6. Should riders be able to comment on tags?
7. Should there be a leaderboard or rider stats?

## Future Ideas

Possible features for later versions:

1. User profiles
2. Leaderboard
3. Admin review queue
4. Multiple city support
5. Tag comments
6. Notifications
7. Rider stats
8. Photo moderation
9. Rules page
10. Shareable tag links

## Notes

These design docs are meant to be lightweight.

They should guide implementation, not slow it down. Once a screen plan feels good enough, it can be translated into real Nuxt pages and Vue components.