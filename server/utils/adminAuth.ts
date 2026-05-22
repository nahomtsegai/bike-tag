const adminAuthorizationPrefix = 'Bearer '

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

export const assertAdminAccess = (event: Parameters<typeof getHeader>[0]) => {
  const expectedAdminApiToken = getRequiredAdminApiToken()
  const authorizationHeader = getHeader(event, 'authorization') ?? ''

  if (!authorizationHeader.startsWith(adminAuthorizationPrefix)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin access is required.'
    })
  }

  const submittedAdminApiToken = authorizationHeader
    .slice(adminAuthorizationPrefix.length)
    .trim()

  if (submittedAdminApiToken !== expectedAdminApiToken) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin access is required.'
    })
  }
}