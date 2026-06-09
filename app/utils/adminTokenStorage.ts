const adminAccessTokenStorageKey = 'bike-tag-admin-access-token'

export const normalizeAdminToken = (adminToken: string) => {
  return adminToken.trim()
}

export const getStoredAdminAccessToken = () => {
  if (!import.meta.client) {
    return ''
  }

  return window.localStorage.getItem(adminAccessTokenStorageKey) ?? ''
}

export const setStoredAdminAccessToken = (accessToken: string) => {
  if (!import.meta.client) {
    return
  }

  const normalizedAccessToken = accessToken.trim()

  if (!normalizedAccessToken) {
    clearStoredAdminAccessToken()
    return
  }

  window.localStorage.setItem(
    adminAccessTokenStorageKey,
    normalizedAccessToken
  )
}

export const clearStoredAdminAccessToken = () => {
  if (!import.meta.client) {
    return
  }

  window.localStorage.removeItem(adminAccessTokenStorageKey)
}

export const getAdminAuthHeaders = () => {
  const accessToken = getStoredAdminAccessToken()

  if (!accessToken) {
    return undefined
  }

  return {
    Authorization: `Bearer ${accessToken}`
  }
}