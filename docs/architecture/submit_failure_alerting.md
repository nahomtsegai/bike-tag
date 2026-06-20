# Production submit failure alerting

Production `POST /api/tags/submit` failures are monitored by a Nitro error hook.
Normal validation, conflict, and rate-limit responses do not trigger alerts.

Unexpected `5xx` failures are counted per failed server step through the durable
`consume_rate_limit` RPC. The defaults send an admin email after three failures
at the same step within ten minutes. After an email is sent, a separate
one-hour cooldown suppresses duplicate alerts for that step.

The thresholds can be overridden with:

```text
NUXT_SUBMIT_FAILURE_ALERT_THRESHOLD
NUXT_SUBMIT_FAILURE_ALERT_THRESHOLD_WINDOW_MS
NUXT_SUBMIT_FAILURE_ALERT_ATTEMPTS
NUXT_SUBMIT_FAILURE_ALERT_WINDOW_MS
```

Alerts include the configured threshold, request ID, available submission
identifiers, failed and final server steps, status information, duration,
uploaded-photo count, the original error message, and a direct link to
`/admin/errors`.

Both limiter checks fail open. If the durable limiter is unavailable, Bike Tag
still attempts to send the alert so an infrastructure incident is not hidden.
Email delivery remains best-effort and can never replace or hide the original
API error.

## Promotion verification

Promotion pull requests to `preview` or `production` must pass the `Verify app`
GitHub Actions job before merge. That gate runs the repository verification,
API tests, browser tests, and preserves the Playwright report for debugging.
