import {
  adminSessionCookieName,
  assertAdminRequestAccess,
  isValidAdminApiToken
} from '../../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  try {
    const adminAccess = await assertAdminRequestAccess(event)

    if (adminAccess.authType === 'supabase') {
      return {
        isAuthenticated: true,
        authType: 'supabase',
        adminUser: adminAccess.adminUser
          ? {
              id: adminAccess.adminUser.id,
              email: adminAccess.adminUser.email,
              displayName: adminAccess.adminUser.display_name
            }
          : null
      }
    }

    return {
      isAuthenticated: true,
      authType: 'session',
      adminUser: null
    }
  } catch {
    const adminSessionToken = getCookie(event, adminSessionCookieName) ?? ''
    const isAuthenticated = isValidAdminApiToken(adminSessionToken)

    return {
      isAuthenticated,
      authType: isAuthenticated ? 'session' : null,
      adminUser: null
    }
  }
})