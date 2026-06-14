import { expect, test } from '@playwright/test'

test.describe('API access boundaries', () => {
  test('reports an unauthenticated admin session without exposing user data', async ({
    request
  }) => {
    const response = await request.get('/api/admin/session')

    expect(response.ok()).toBe(true)
    await expect(response.json()).resolves.toEqual({
      isAuthenticated: false,
      authType: null,
      adminUser: null
    })
  })

  test('rejects unauthenticated access to admin submissions', async ({
    request
  }) => {
    const response = await request.get('/api/admin/submissions')

    expect(response.status()).toBe(403)
  })

  test('rejects an invalid public submission reference before database access', async ({
    request
  }) => {
    const response = await request.get('/api/submissions/status/not-a-uuid')

    expect(response.status()).toBe(400)
  })
})
