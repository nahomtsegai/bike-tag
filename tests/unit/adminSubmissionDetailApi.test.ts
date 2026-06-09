import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAdminSubmissionDetail } from '../../app/utils/adminSubmissionDetailApi'

const fetchMock = vi.fn()

const getAdminAuthHeadersMock = vi.hoisted(() => {
  return vi.fn()
})

vi.stubGlobal('$fetch', fetchMock)

vi.mock('../../app/utils/adminTokenStorage', () => {
  return {
    getAdminAuthHeaders: getAdminAuthHeadersMock
  }
})

describe('adminSubmissionDetailApi', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    getAdminAuthHeadersMock.mockReset()

    getAdminAuthHeadersMock.mockReturnValue({
      Authorization: 'Bearer test-admin-token'
    })
  })

  describe('getAdminSubmissionDetail', () => {
    it('calls the selected submission detail endpoint', async () => {
      fetchMock.mockResolvedValueOnce({
        success: true,
        submission: {
          id: 'submission-123',
          activeTagId: 'tag-456',
          riderName: 'Rider',
          foundLocationMapUrl: 'https://maps.example.com/found',
          matchPhotoUrl: 'https://photos.example.com/match.jpg',
          nextTitle: 'Bridge Tag',
          nextClue: 'Look near the river.',
          nextHiddenLocationMapUrl: 'https://maps.example.com/hidden',
          nextTagPhotoUrl: 'https://photos.example.com/next.jpg',
          status: 'pending',
          rejectionReason: null,
          reviewedAt: null,
          reviewedBy: null,
          createdAt: '2026-05-26T12:00:00.000Z',
          updatedAt: '2026-05-26T12:00:00.000Z'
        }
      })

      await getAdminSubmissionDetail({
        submissionId: 'submission-123'
      })

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/submissions/submission-123',
        {
          headers: {
            Authorization: 'Bearer test-admin-token'
          }
        }
      )
    })
  })
})