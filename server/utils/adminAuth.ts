export const adminSessionCookieName = 'bike-tag-admin-session'

export const getAdminSessionCookieOptions = () => {
  return {
    httpOnly: true,
    maxAge: 60 * 60 * 8,
    path: '/api/admin',
    sameSite: 'strict' as const,
    secure: !import.meta.dev
  }
}

const getRequiredAdminApiToken = () => {
  const runtimeConfig = useRuntimeConfig()
  const adminApiToken = runtimeConfig.adminApiToken

  if (typeof adminApiToken !== 'string' || !adminApiToken.trim()) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing required environment variable: NUXT_ADMIN_API_TOKEN'
    })
  }

  return adminApiToken.trim()
}

export const isValidAdminApiToken = (adminApiToken: string) => {
  const expectedAdminApiToken = getRequiredAdminApiToken()
  const submittedAdminApiToken = adminApiToken.trim()

  if (!submittedAdminApiToken) {
    return false
  }

  return submittedAdminApiToken === expectedAdminApiToken
}

export const assertValidAdminApiToken = (adminApiToken: string) => {
  if (!isValidAdminApiToken(adminApiToken)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin access is required.'
    })
  }
}

export const assertAdminAccess = (event: Parameters<typeof getCookie>[0]) => {
  const adminSessionToken = getCookie(event, adminSessionCookieName) ?? ''

  assertValidAdminApiToken(adminSessionToken)
}