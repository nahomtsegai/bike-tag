# Production submit failure alerting

Production `POST /api/tags/submit` failures are monitored by a Nitro error hook.
Unexpected `5xx` responses send a best-effort email through the existing Resend
configuration. Normal validation and conflict responses do not send alerts.

Alerts include the request ID, available submission identifiers, failed and
final server steps, status information, duration, uploaded-photo count, and the
original error message. The request ID can be used to correlate the email with
Vercel runtime logs and `submit_diagnostic_events`.

Repeated failures are throttled per failed server step through the durable
`consume_rate_limit` RPC. The defaults allow one alert per step every ten
minutes. They can be overridden with:

```text
NUXT_SUBMIT_FAILURE_ALERT_ATTEMPTS
NUXT_SUBMIT_FAILURE_ALERT_WINDOW_MS
```

The limiter fails open: if the database is unavailable, Bike Tag still attempts
to send the alert. Email delivery itself is always best-effort and can never
replace or hide the original API error.
