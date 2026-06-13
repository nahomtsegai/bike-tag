import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  adminSessionCookieName,
  adminSupabaseAccessTokenCookieName,
  getAdminSessionCookieOptions,
  getAdminSupabaseAccessTokenCookieOptions
} from '../../server/utils/adminAuth'

describe('adminAuth cookie configuration', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('uses separate cookie names for static and Supabase sessions', () => {
    expect(adminSessionCookieName).toBe('bike-tag-admin-session')
    expect(adminSupabaseAccessTokenCookieName).toBe(
      'bike-tag-admin-supabase-access-token'
    )
  })

  it('keeps admin cookies httpOnly and scoped to admin APIs', () => {
    expect(getAdminSessionCookieOptions()).toMatchObject({
      httpOnly: true,
      maxAge: 60 * 60 * 8,
      path: '/api/admin',
      sameSite: 'strict'
    })
  })

  it('sets the Supabase cookie lifetime from the access token expiry', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-13T12:00:00.000Z'))

    const expiresAt = Math.floor(Date.now() / 1000) + 1800

    expect(
      getAdminSupabaseAccessTokenCookieOptions(expiresAt)
    ).toMatchObject({
      httpOnly: true,
      maxAge: 1800,
      path: '/api/admin',
      sameSite: 'strict'
    })
  })
})
