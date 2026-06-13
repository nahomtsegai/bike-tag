import { describe, expect, it } from 'vitest'
import {
  getAdminAuthHeaders,
  normalizeAdminToken
} from '../../app/utils/adminTokenStorage'

describe('adminTokenStorage', () => {
  describe('normalizeAdminToken', () => {
    it('trims whitespace from the admin token', () => {
      expect(normalizeAdminToken('  secret-token  ')).toBe('secret-token')
    })
  })

  it('does not build client authorization headers', () => {
    expect(getAdminAuthHeaders()).toBeUndefined()
  })
})
