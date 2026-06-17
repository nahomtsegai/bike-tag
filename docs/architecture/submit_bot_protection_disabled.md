# Submit Bot Protection Rollback

Vercel BotID enforcement on `POST /api/tags/submit` is temporarily disabled after legitimate production submissions were classified as automated and rejected with HTTP 403.

The durable per-IP submit rate limiter remains enabled inside the submit route. BotID client and utility code remain in the repository so the integration can be reintroduced after production-safe diagnostics and Preview verification are added.
