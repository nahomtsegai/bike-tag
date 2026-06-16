# Submit Bot Protection

Bike Tag protects `POST /api/tags/submit` with Vercel BotID before the request reaches the submit route.

## Request flow

1. The Nuxt BotID module configures the required proxy rewrites.
2. The client plugin marks `POST /api/tags/submit` as a protected request.
3. Server middleware performs the BotID check before multipart parsing, image sanitization, storage uploads, database writes, or notification delivery.
4. Requests classified as automated receive HTTP `403`.
5. BotID verification failures fail closed with HTTP `503`.
6. Verified requests still pass through the durable per-IP submit rate limiter.

## Local development and CI

BotID verification runs only when Vercel sets `VERCEL=1`. Built local servers and GitHub Actions workflow servers bypass the platform check because they do not receive Vercel's BotID and OIDC request headers.

This keeps local API, browser, and workflow tests usable without weakening deployed Preview or Production protection. Unit tests cover runtime gating and inject explicit BotID results for allowed, rejected, and unavailable verification outcomes.

## Production verification

After deployment:

1. Submit through the application UI and confirm a normal rider submission succeeds.
2. Confirm direct production requests that do not originate from an initialized application page are rejected.
3. Confirm rejected requests do not create Supabase submissions or Storage objects.
4. Keep the existing durable submit rate limiter enabled as a second protection layer.

BotID Deep Analysis may be enabled later in the Vercel Firewall dashboard when the project plan supports it. The code-level protection does not depend on Deep Analysis being enabled.
