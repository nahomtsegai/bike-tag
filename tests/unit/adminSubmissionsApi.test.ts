import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAdminSubmissions } from '../../app/utils/adminSubmissionsApi'

const fetchMock = vi.fn()

vi.stubGlobal('$fetch', fetchMock)

describe('adminSubmissionsApi', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  describe('getAdminSubmissions', () => {
    it('calls the admin submissions list endpoint with query params and auth headers', async () => {
      fetchMock.mockResolvedValueOnce({
        success: true,
        submissions: [],
        summary: {
          pending: 0,
          approved: 0,
          rejected: 0
        },
        pagination: {
          limit: 25,
          offset: 0,
          count: 0,
          hasMore: false
        }
      })

      await getAdminSubmissions({
        queryParams: 'limit=25&offset=0&status=pending',
        headers: {
          Authorization: 'Bearer secret-token'
        }
      })

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/submissions?limit=25&offset=0&status=pending',
        {
          headers: {
            Authorization: 'Bearer secret-token'
          }
        }
      )
    })
  })
})