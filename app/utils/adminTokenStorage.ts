const adminAccessTokenStorageKey = 'bike-tag-admin-access-token'

export const clearStoredAdminAccessToken = () => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(adminAccessTokenStorageKey)
}