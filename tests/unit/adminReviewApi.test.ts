import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  approveAdminSubmission,
  rejectAdminSubmission
} from '../../app/utils/adminReviewApi'

const fetchMock = vi.fn()

vi.stubGlobal('$fetch', fetchMock)

describe('adminReviewApi', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  describe('approveAdminSubmission', () => {
    it('calls the approve submission endpoint with reviewer details', async () => {
      fetchMock.mockResolvedValueOnce({
        success: true,
        message: 'Submission approved.',
        submissionId: 'submission-123',
        foundTagId: 'tag-456'
      })

      await approveAdminSubmission({
        submissionId: 'submission-123',
        reviewedBy: 'Rider'
      })

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/submissions/submission-123/approve',
        {
          method: 'POST',
          body: {
            reviewedBy: 'Rider'
          }
        }
      )
    })
  })

  describe('rejectAdminSubmission', () => {
    it('calls the reject submission endpoint with reviewer details and rejection reason', async () => {
      fetchMock.mockResolvedValueOnce({
        success: true,
        message: 'Submission rejected.',
        submissionId: 'submission-123',
        status: 'rejected'
      })

      await rejectAdminSubmission({
        submissionId: 'submission-123',
        reviewedBy: 'Rider',
        rejectionReason: 'Photo does not match.'
      })

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/submissions/submission-123/reject',
        {
          method: 'POST',
          body: {
            reviewedBy: 'Rider',
            rejectionReason: 'Photo does not match.'
          }
        }
      )
    })

    it('allows rejection reason to be omitted', async () => {
      fetchMock.mockResolvedValueOnce({
        success: true,
        message: 'Submission rejected.',
        submissionId: 'submission-123',
        status: 'rejected'
      })

      await rejectAdminSubmission({
        submissionId: 'submission-123',
        reviewedBy: 'Rider'
      })

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/submissions/submission-123/reject',
        {
          method: 'POST',
          body: {
            reviewedBy: 'Rider',
            rejectionReason: undefined
          }
        }
      )
    })
  })
})