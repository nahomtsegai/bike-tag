import {
  adminSessionCookieName,
  getAdminSessionCookieOptions
} from '../../../utils/adminAuth'

export default defineEventHandler((event) => {
  deleteCookie(
    event,
    adminSessionCookieName,
    getAdminSessionCookieOptions()
  )

  return {
    isAuthenticated: false,
    authType: null,
    adminUser: null
  }
})