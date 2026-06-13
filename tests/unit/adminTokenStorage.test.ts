import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearStoredAdminAccessToken } from '../../app/utils/adminTokenStorage'

const removeItemMock = vi.fn()

describe('adminTokenStorage', () => {
  beforeEach(() => {
    removeItemMock.mockReset()

    vi.stubGlobal('window', {
      localStorage: {
        removeItem: removeItemMock
      }
    })
  })

  it('removes the legacy admin access token from local storage', () => {
    clearStoredAdminAccessToken()

    expect(removeItemMock).toHaveBeenCalledWith(
      'bike-tag-admin-access-token'
    )
  })
})