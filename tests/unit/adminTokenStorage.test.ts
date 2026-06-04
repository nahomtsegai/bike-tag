import { describe, expect, it } from 'vitest'
import { normalizeAdminToken } from '../../app/utils/adminTokenStorage'

describe('adminTokenStorage', () => {
  describe('normalizeAdminToken', () => {
    it('trims whitespace from the admin token', () => {
      expect(normalizeAdminToken('  secret-token  ')).toBe('secret-token')
    })
  })
})