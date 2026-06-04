import { beforeEach, describe, expect, it, vi } from 'vitest'
import { archiveAdminSubmission } from '../../app/utils/adminArchiveSubmissionApi'

const fetchMock = vi.hoisted(() => {
  return vi.fn()
})

vi.stubGlobal('$fetch', fetchMock)

const submissionId = '123e4567-e89b-42d3-a456-426614174000'

describe('adminArchiveSubmissionApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('archives a submission', async () => {
    fetchMock.mockResolvedValueOnce({
      success: true,
      submissionId,
      archivedAt: '2026-06-02T19:00:00.000Z'
    })

    await expect(
      archiveAdminSubmission({
        submissionId
      })
    ).resolves.toEqual({
      success: true,
      submissionId,
      archivedAt: '2026-06-02T19:00:00.000Z'
    })

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/admin/submissions/${submissionId}/archive`,
      {
        method: 'POST'
      }
    )
  })

  it('throws a friendly API error message', async () => {
    fetchMock.mockRejectedValueOnce({
      data: {
        statusMessage: 'Only approved submissions can be archived.'
      }
    })

    await expect(
      archiveAdminSubmission({
        submissionId
      })
    ).rejects.toThrow('Only approved submissions can be archived.')
  })

  it('throws a fallback error message', async () => {
    fetchMock.mockRejectedValueOnce({})

    await expect(
      archiveAdminSubmission({
        submissionId
      })
    ).rejects.toThrow('Could not archive this submission. Try again.')
  })
})