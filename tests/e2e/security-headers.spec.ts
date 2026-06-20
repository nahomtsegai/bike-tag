import { expect, test } from '@playwright/test'

const broadHttpsImageSource = /(?:^|;\s*)img-src[^;]*\shttps:(?:\s|;|$)/
const broadWebSocketConnectionSource =
  /(?:^|;\s*)connect-src[^;]*\s(?:ws:|wss:)(?:\s|;|$)/

test('homepage exposes a scoped report-only content security policy', async ({
  request
}) => {
  const response = await request.get('/')
  const headers = response.headers()
  const policy = headers['content-security-policy-report-only'] ?? ''

  expect(response.ok()).toBe(true)
  expect(policy).toContain("default-src 'self'")
  expect(policy).toContain("frame-src 'none'")
  expect(policy).toContain(
    "img-src 'self' data: blob: https://*.tile.openstreetmap.org"
  )
  expect(policy).toContain("connect-src 'self'")
  expect(policy).not.toMatch(broadHttpsImageSource)
  expect(policy).not.toMatch(broadWebSocketConnectionSource)
  expect(headers['content-security-policy']).toBeUndefined()
})
