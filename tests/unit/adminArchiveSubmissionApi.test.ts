import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../server/api/admin/submissions/[id]/archive.post'

const assertAdminRequestAccessMock = vi.hoisted(() => {
  return vi.fn()
})

const archiveApprovedSubmissionInSupabaseMock = vi.hoisted(() => {
  return vi.fn()
})

vi.mock('../../server/utils/adminAuth', () => {
  return {
    assertAdminRequestAccess: assertAdminRequestAccessMock
  }
})

vi.mock('../../server/utils/supabaseArchiveSubmission', () => {
  return {
    archiveApprovedSubmissionInSupabase:
      archiveApprovedSubmissionInSupabaseMock
  }
})

const createEvent = (submissionId: string | undefined) => {
  return {
    context: {
      params: {
        id: submissionId
      }
    }
  }
}

const submissionId = '123e4567-e89b-42d3-a456-426614174000'
const archivedAt = '2026-06-02T19:00:00.000Z'

describe('admin archive submission API', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    assertAdminRequestAccessMock.mockResolvedValue({
      authType: 'supabase',
      adminUser: {
        id: 'admin-user-id',
        user_id: 'auth-user-id',
        email: 'nytsegai@gmail.com',
        display_name: 'Nahom',
        created_at: '2026-06-09T00:00:00.000Z'
      }
    })
  })

  it('archives an approved submission when admin access is valid', async () => {
    archiveApprovedSubmissionInSupabaseMock.mockResolvedValueOnce({
      submissionId,
      archivedAt
    })

    await expect(handler(createEvent(submissionId) as never)).resolves.toEqual({
      success: true,
      submissionId,
      archivedAt
    })

    expect(assertAdminRequestAccessMock).toHaveBeenCalledWith(expect.anything())

    expect(archiveApprovedSubmissionInSupabaseMock).toHaveBeenCalledWith({
      submissionId
    })
  })

  it('returns a 400 error when submission id is missing', async () => {
    await expect(
      handler(createEvent(undefined) as never)
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Submission id is required.'
    })

    expect(archiveApprovedSubmissionInSupabaseMock).not.toHaveBeenCalled()
  })

  it('returns a 400 error when submission id is invalid', async () => {
    await expect(
      handler(createEvent('not-a-uuid') as never)
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Submission id must be a valid UUID.'
    })

    expect(archiveApprovedSubmissionInSupabaseMock).not.toHaveBeenCalled()
  })
})