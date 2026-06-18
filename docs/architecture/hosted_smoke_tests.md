# Hosted Smoke Tests

## Purpose

The hosted smoke suite verifies that a deployed Bike Tag environment is reachable and still exposes the expected public and unauthenticated contracts.

The suite is intentionally read-only. It does not create submissions, upload photos, authenticate an admin, approve or reject records, modify storage, or change database state.

## Coverage

The smoke runner checks:

1. The homepage returns `200` and contains the Louisville Bike Tag title
2. Expected security headers are present
3. `/api/tags/current` returns the public current-tag contract
4. The current-tag response does not expose hidden location fields
5. `/api/tags` returns a tag-history array
6. `/api/admin/session` reports an unauthenticated session without user data
7. `/api/admin/submissions` rejects unauthenticated access with `403`
8. An invalid public submission reference is rejected with `400`

Transient network errors, `429` responses, and `5xx` responses are retried up to three times. Contract failures and other unexpected status codes fail immediately.

## Local Command

Run against Production:

```bash
npm run smoke:hosted -- \
  --base-url https://louisvillebiketag.vercel.app \
  --environment production
```

Run against Preview:

```bash
VERCEL_AUTOMATION_BYPASS_SECRET=your-preview-bypass-secret \
  npm run smoke:hosted -- \
  --base-url https://louisvillebiketagpreview.vercel.app \
  --environment preview
```

The equivalent environment variables are:

```text
SMOKE_BASE_URL
SMOKE_ENVIRONMENT
VERCEL_AUTOMATION_BYPASS_SECRET
```

## GitHub Actions Workflow

Workflow:

```text
.github/workflows/hosted-smoke.yml
```

The workflow runs when Vercel reports a successful deployment for either:

- `preview`
- `production`

It can also be started manually through `workflow_dispatch`, with an optional URL override.

The workflow uses the canonical aliases:

```text
https://louisvillebiketagpreview.vercel.app
https://louisvillebiketag.vercel.app
```

Using the canonical aliases ensures the smoke test verifies the environment riders and admins actually use, rather than only checking an immutable deployment URL.

## Preview Deployment Protection

Preview is protected by Vercel authentication. Automated checks use Vercel's Protection Bypass for Automation header:

```text
x-vercel-protection-bypass
```

Create the automation bypass secret in the Vercel project Deployment Protection settings, then add the same value as this GitHub repository secret:

```text
VERCEL_AUTOMATION_BYPASS_SECRET
```

The workflow fails with a setup message when a Preview smoke run starts without that repository secret. Production does not use the bypass secret.

Do not commit the bypass value to the repository or place it in a workflow file.

## Reports

Each workflow run uploads:

```text
hosted-smoke-report/hosted-smoke.log
```

The artifact is retained for 14 days and is uploaded even when a smoke check fails, unless the workflow is cancelled.

## Failure Handling

When a smoke check fails:

1. Confirm the Vercel deployment is ready
2. Review the hosted smoke artifact
3. Check whether the failure is availability, contract, authorization, or security-header related
4. Review Vercel runtime logs for the affected deployment
5. Roll back or prepare a focused fix when Production behavior is affected

A successful build is not sufficient evidence that a hosted environment is healthy. Promotion verification should include the hosted smoke result for the deployed branch.
