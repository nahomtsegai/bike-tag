import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../server/api/submissions/status/[id].get'
import type { PublicSubmissionStatusResponse } from '../../shared/types/submissionStatus'

const getPublicSubmissionStatusMock = vi.hoisted(() => {
  return vi.fn()
})

const createSupabaseServerClientMock = vi.hoisted(() => {
  return vi.fn(() => {
    return {
      from: vi.fn()
    }
  })
})

vi.mock('../../server/utils/supabaseSubmissionStatus', () => {
  return {
    getPublicSubmissionStatus: getPublicSubmissionStatusMock
  }
})

vi.mock('../../server/utils/supabase', () => {
  return {
    createSupabaseServerClient: createSupabaseServerClientMock
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

const submissionStatus: PublicSubmissionStatusResponse = {
  id: '123e4567-e89b-42d3-a456-426614174000',
  status: 'pending',
  submittedAt: '2026-05-31T12:00:00.000Z',
  reviewedAt: null,
  riderName: 'River',
  nextTitle: 'Bridge view',
  reviewNote: null
}

describe('submission status API', () => {

    beforeEach(() => { vi.clearAllMocks() })

  it('returns public submission status for a valid reference code', async () => {
    getPublicSubmissionStatusMock.mockResolvedValueOnce(submissionStatus)

    await expect(
      handler(createEvent(submissionStatus.id) as never)
    ).resolves.toEqual(submissionStatus)

    expect(createSupabaseServerClientMock).toHaveBeenCalled()

    expect(getPublicSubmissionStatusMock).toHaveBeenCalledWith(
      expect.anything(),
      submissionStatus.id
    )
  })

  it('returns a 400 error for an invalid reference code', async () => {
    await expect(
      handler(createEvent('not-a-uuid') as never)
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Enter a valid submission reference code.'
    })

    expect(createSupabaseServerClientMock).not.toHaveBeenCalled()
    expect(getPublicSubmissionStatusMock).not.toHaveBeenCalled()
  })

  it('returns a 400 error when the reference code is missing', async () => {
    await expect(
      handler(createEvent(undefined) as never)
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Enter a valid submission reference code.'
    })

    expect(createSupabaseServerClientMock).not.toHaveBeenCalled()
    expect(getPublicSubmissionStatusMock).not.toHaveBeenCalled()
  })

  it('returns a 404 error when no submission is found', async () => {
    getPublicSubmissionStatusMock.mockResolvedValueOnce(null)

    await expect(
      handler(createEvent(submissionStatus.id) as never)
    ).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'No submission was found for that reference code.'
    })
  })
})