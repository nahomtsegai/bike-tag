import { describe, expect, it, vi } from 'vitest'
import {
  adminTokenStorageKey,
  clearSavedAdminToken,
  getSavedAdminToken,
  normalizeAdminToken,
  saveAdminTokenToStorage,
  type AdminTokenStorage
} from '../../app/utils/adminTokenStorage'

const createMockStorage = (
  savedAdminToken: string | null = null
): AdminTokenStorage => {
  return {
    getItem: vi.fn(() => {
      return savedAdminToken
    }),
    setItem: vi.fn(),
    removeItem: vi.fn()
  }
}

describe('adminTokenStorage', () => {
  describe('normalizeAdminToken', () => {
    it('trims whitespace from the admin token', () => {
      expect(normalizeAdminToken('  secret-token  ')).toBe('secret-token')
    })
  })

  describe('getSavedAdminToken', () => {
    it('reads the saved admin token from storage', () => {
      const storage = createMockStorage('secret-token')

      expect(getSavedAdminToken(storage)).toBe('secret-token')
      expect(storage.getItem).toHaveBeenCalledWith(adminTokenStorageKey)
    })
  })

  describe('saveAdminTokenToStorage', () => {
    it('saves the normalized admin token to storage', () => {
      const storage = createMockStorage()

      saveAdminTokenToStorage(storage, '  secret-token  ')

      expect(storage.setItem).toHaveBeenCalledWith(
        adminTokenStorageKey,
        'secret-token'
      )
    })
  })

  describe('clearSavedAdminToken', () => {
    it('removes the saved admin token from storage', () => {
      const storage = createMockStorage()

      clearSavedAdminToken(storage)

      expect(storage.removeItem).toHaveBeenCalledWith(adminTokenStorageKey)
    })
  })
})