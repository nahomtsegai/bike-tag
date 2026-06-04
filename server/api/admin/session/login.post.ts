import {
  adminSessionCookieName,
  assertValidAdminApiToken,
  getAdminSessionCookieOptions
} from '../../../utils/adminAuth'

type AdminLoginRequestBody = {
  adminToken?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<AdminLoginRequestBody>(event)
  const adminToken = body.adminToken?.trim() ?? ''

  assertValidAdminApiToken(adminToken)

  setCookie(
    event,
    adminSessionCookieName,
    adminToken,
    getAdminSessionCookieOptions()
  )

  return {
    isAuthenticated: true
  }
})