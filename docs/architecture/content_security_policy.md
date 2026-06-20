# Content Security Policy

Bike Tag currently sends `Content-Security-Policy-Report-Only`. Browsers evaluate the policy without blocking application behavior.

## Allowed external sources

The policy includes only the external services intentionally used by the app:

- The configured Supabase HTTP origin
- The matching Supabase WebSocket origin
- `https://*.tile.openstreetmap.org` for Leaflet map tiles
- Same-origin, `data:`, and `blob:` sources where required

Broad `https:`, `ws:`, and `wss:` allowances are not used for image or connection directives.

## Automated checks

Tests verify exact Supabase origins, local development origins, OpenStreetMap access, invalid URL handling, removal of broad scheme allowances, and continued report-only behavior.

## Before enforcement

Keep the policy in report-only mode until Preview testing covers public navigation, maps, admin authentication, location capture, submission review, and supported image formats on representative mobile devices. The remaining inline script and style allowances must also be reviewed before enforcement.
