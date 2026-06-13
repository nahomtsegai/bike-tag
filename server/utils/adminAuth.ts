export const adminSessionCookieName = 'bike-tag-admin-session'
export const adminSupabaseAccessTokenCookieName =
  'bike-tag-admin-supabase-access-token'

const getBaseAdminSessionCookieOptions = () => {
  return {
    httpOnly: true,
    path: '/api/admin',
    sameSite: 'strict' as const,
    secure: !import.meta.dev
  }
}

export const getAdminSessionCookieOptions = () => {
  return {
    ...getBaseAdminSessionCookieOptions(),
    maxAge: 60 * 60 * 8
  }
}

const getSupabaseAccessTokenCookieMaxAge = (expiresAt?: number) => {
  const fallbackMaxAgeSeconds = 60 * 60

  if (!Number.isFinite(expiresAt)) {
    return fallbackMaxAgeSeconds
  }

  const currentTimeSeconds = Math.floor(Date.now() / 1000)
  const remainingLifetimeSeconds = Math.floor(
    (expiresAt as number) - currentTimeSeconds
  )

  return Math.max(1, remainingLifetimeSeconds)
}

export const getAdminSupabaseAccessTokenCookieOptions = (
  expiresAt?: number
) => {
  return {
    ...getBaseAdminSessionCookieOptions(),
    maxAge: getSupabaseAccessTokenCookieMaxAge(expiresAt)
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

export const assertAdminRequestAccess = async (
  event: Parameters<typeof getCookie>[0]
) => {
  const adminUser = await getAuthenticatedAdminUser(event)

  if (adminUser) {
    return {
      authType: 'supabase' as const,
      adminUser
    }
  }

  assertAdminAccess(event)

  return {
    authType: 'session' as const,
    adminUser: null
  }
}
