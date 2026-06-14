import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { rejectSubmissionInSupabase } from '../../server/utils/supabaseRejectSubmission'

type CreateErrorInput = {
  statusCode: number
  statusMessage: string
}

type SubmissionLoadState = {
  data: unknown
  error: { message: string } | null
}

const submissionLoadState = vi.hoisted<SubmissionLoadState>(() => ({
  data: null,
  error: null
}))
const rpcMock = vi.hoisted(() => vi.fn())
const deleteBikeTagPhotosMock = vi.hoisted(() => vi.fn())
const deletePendingBikeTagPhotosMock = vi.hoisted(() => vi.fn())

vi.mock('../../server/utils/supabaseStorage', () => {
  return {
    getStoragePathFromPublicUrl: (publicUrl: string) => {
      const marker = '/storage/v1/object/public/bike_tag_photos/'
      const markerIndex = publicUrl.indexOf(marker)

      return markerIndex === -1
        ? ''
        : publicUrl.slice(markerIndex + marker.length)
    },
    deleteBikeTagPhotos: deleteBikeTagPhotosMock,
    deletePendingBikeTagPhotos: deletePendingBikeTagPhotosMock
  }
})

vi.mock('../../server/utils/supabase', () => {
  return {
    createSupabaseServerClient: () => {
      return {
        from: () => {
          return {
            select: () => {
              return {
                eq: () => {
                  return {
                    single: async () => {
                      return submissionLoadState
                    }
                  }
                }
              }
            }
          }
        },
        rpc: rpcMock
      }
    }
  }
})

const createTestError = ({ statusCode, statusMessage }: CreateErrorInput) => {
  const error = new Error(statusMessage) as Error & CreateErrorInput

  error.statusCode = statusCode
  error.statusMessage = statusMessage

  return error
}

const privatePhotoReferences = {
  match_photo_url: null,
  match_photo_storage_path: 'submissions/group-123/match_photo.jpg',
  next_tag_photo_url: null,
  next_tag_photo_storage_path: 'submissions/group-123/tag_photo.jpg'
}

describe('supabaseRejectSubmission', () => {
  beforeEach(() => {
    submissionLoadState.data = privatePhotoReferences
    submissionLoadState.error = null
    rpcMock.mockReset()
    deleteBikeTagPhotosMock.mockReset()
    deletePendingBikeTagPhotosMock.mockReset()
    rpcMock.mockResolvedValue({
      data: [
        {
          submission_id: 'submission-123'
        }
      ],
      error: null
    })
    vi.stubGlobal('createError', createTestError)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('rejects a submission and deletes private pending photos', async () => {
    await expect(
      rejectSubmissionInSupabase({
        submissionId: 'submission-123',
        reviewedBy: 'Admin Rider',
        rejectionReason: 'Photo does not match.'
      })
    ).resolves.toEqual({
      submissionId: 'submission-123'
    })

    expect(rpcMock).toHaveBeenCalledWith('reject_submission', {
      p_submission_id: 'submission-123',
      p_reviewed_by: 'Admin Rider',
      p_rejection_reason: 'Photo does not match.'
    })
    expect(deletePendingBikeTagPhotosMock).toHaveBeenCalledWith([
      'submissions/group-123/match_photo.jpg',
      'submissions/group-123/tag_photo.jpg'
    ])
    expect(deleteBikeTagPhotosMock).not.toHaveBeenCalled()
  })

  it('deletes legacy public photos when rejecting an older submission', async () => {
    submissionLoadState.data = {
      match_photo_url:
        'https://example.supabase.co/storage/v1/object/public/bike_tag_photos/tags/legacy/match.jpg',
      match_photo_storage_path: null,
      next_tag_photo_url:
        'https://example.supabase.co/storage/v1/object/public/bike_tag_photos/tags/legacy/next.jpg',
      next_tag_photo_storage_path: null
    }

    await expect(
      rejectSubmissionInSupabase({
        submissionId: 'submission-123',
        reviewedBy: 'Admin Rider'
      })
    ).resolves.toEqual({
      submissionId: 'submission-123'
    })

    expect(deleteBikeTagPhotosMock).toHaveBeenCalledWith([
      'tags/legacy/match.jpg',
      'tags/legacy/next.jpg'
    ])
    expect(deletePendingBikeTagPhotosMock).not.toHaveBeenCalled()
  })

  it('does not delete photos when rejection fails', async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: {
        message: 'SUBMISSION_NOT_PENDING'
      }
    })

    await expect(
      rejectSubmissionInSupabase({
        submissionId: 'submission-123',
        reviewedBy: 'Admin Rider'
      })
    ).rejects.toMatchObject({
      statusCode: 409,
      statusMessage: 'Submission has already been reviewed.'
    })

    expect(deleteBikeTagPhotosMock).not.toHaveBeenCalled()
    expect(deletePendingBikeTagPhotosMock).not.toHaveBeenCalled()
  })

  it('does not fail rejection when private cleanup fails', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    deletePendingBikeTagPhotosMock.mockRejectedValueOnce(
      new Error('private cleanup failed')
    )

    await expect(
      rejectSubmissionInSupabase({
        submissionId: 'submission-123',
        reviewedBy: 'Admin Rider'
      })
    ).resolves.toEqual({
      submissionId: 'submission-123'
    })

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Could not delete rejected private submission photos.',
      expect.objectContaining({
        submissionId: 'submission-123'
      })
    )

    consoleErrorSpy.mockRestore()
  })
})
