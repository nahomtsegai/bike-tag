const adminAccessTokenStorageKey = 'bike-tag-admin-access-token'

export const normalizeAdminToken = (adminToken: string) => {
  return adminToken.trim()
}

export const clearStoredAdminAccessToken = () => {
  if (!import.meta.client) {
    return
  }

  window.localStorage.removeItem(adminAccessTokenStorageKey)
}

export const getAdminAuthHeaders = () => {
  return undefined
}
