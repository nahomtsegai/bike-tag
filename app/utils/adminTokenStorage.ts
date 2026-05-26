export const adminTokenStorageKey = 'bike-tag-admin-token'

export type AdminTokenStorage = Pick<
  Storage,
  'getItem' | 'setItem' | 'removeItem'
>

export const normalizeAdminToken = (adminToken: string) => {
  return adminToken.trim()
}

export const getSavedAdminToken = (storage: AdminTokenStorage) => {
  return storage.getItem(adminTokenStorageKey)
}

export const saveAdminTokenToStorage = (
  storage: AdminTokenStorage,
  adminToken: string
) => {
  storage.setItem(adminTokenStorageKey, normalizeAdminToken(adminToken))
}

export const clearSavedAdminToken = (storage: AdminTokenStorage) => {
  storage.removeItem(adminTokenStorageKey)
}