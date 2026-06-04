import {
  adminSessionCookieName,
  isValidAdminApiToken
} from '../../../utils/adminAuth'

export default defineEventHandler((event) => {
  const adminSessionToken = getCookie(event, adminSessionCookieName) ?? ''
  const isAuthenticated = isValidAdminApiToken(adminSessionToken)

  return {
    isAuthenticated
  }
})