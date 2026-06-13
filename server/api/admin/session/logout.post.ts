import {
  adminSessionCookieName,
  adminSupabaseAccessTokenCookieName,
  getAdminSessionCookieOptions,
  getAdminSupabaseAccessTokenCookieOptions
} from '../../../utils/adminAuth'

export default defineEventHandler((event) => {
  deleteCookie(
    event,
    adminSessionCookieName,
    getAdminSessionCookieOptions()
  )

  deleteCookie(
    event,
    adminSupabaseAccessTokenCookieName,
    getAdminSupabaseAccessTokenCookieOptions()
  )

  return {
    isAuthenticated: false,
    authType: null,
    adminUser: null
  }
})
