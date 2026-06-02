import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteAdminSubmission } from '../../app/utils/adminDeleteSubmissionApi'

const fetchMock = vi.hoisted(() => {
  return vi.fn()
})

vi.stubGlobal('$fetch', fetchMock)

const submissionId = '123e4567-e89b-42d3-a456-426614174000'

const headers = {
  Authorization: 'Bearer secret-token'
}

describe('adminDeleteSubmissionApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes a submission with provided admin headers', async () => {
    fetchMock.mockResolvedValueOnce({
      success: true,
      submissionId
    })

    await expect(
      deleteAdminSubmission({
        submissionId,
        headers
      })
    ).resolves.toEqual({
      success: true,
      submissionId
    })

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/admin/submissions/${submissionId}/delete`,
      {
        method: 'POST',
        headers
      }
    )
  })

  it('throws a friendly API error message', async () => {
    fetchMock.mockRejectedValueOnce({
      data: {
        statusMessage: 'Only pending submissions can be deleted.'
      }
    })

    await expect(
      deleteAdminSubmission({
        submissionId,
        headers
      })
    ).rejects.toThrow('Only pending submissions can be deleted.')
  })

  it('throws a fallback error message', async () => {
    fetchMock.mockRejectedValueOnce({})

    await expect(
      deleteAdminSubmission({
        submissionId,
        headers
      })
    ).rejects.toThrow('Could not delete this submission. Try again.')
  })
})