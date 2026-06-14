import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { approveSubmissionInSupabase } from '../../server/utils/supabaseApproveSubmission'

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
const promotePendingBikeTagPhotoMock = vi.hoisted(() => vi.fn())
const deleteBikeTagPhotosMock = vi.hoisted(() => vi.fn())
const deletePendingBikeTagPhotosMock = vi.hoisted(() => vi.fn())

vi.mock('../../server/utils/supabaseStorage', () => {
  return {
    promotePendingBikeTagPhoto: promotePendingBikeTagPhotoMock,
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
                    maybeSingle: async () => {
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

const validApproveSubmissionInput = {
  submissionId: 'submission-123',
  reviewedBy: 'Admin Rider'
}

const privateSubmission = {
  id: 'submission-123',
  status: 'pending',
  match_photo_url: null,
  match_photo_storage_path: 'submissions/group-123/match_photo.jpg',
  next_tag_photo_url: null,
  next_tag_photo_storage_path: 'submissions/group-123/tag_photo.jpg'
}

const successfulApprovalResponse = {
  data: [
    {
      submission_id: 'submission-123',
      found_tag_id: 'found-tag-456',
      current_tag_id: 'current-tag-789'
    }
  ],
  error: null
}

describe('supabaseApproveSubmission', () => {
  beforeEach(() => {
    submissionLoadState.data = privateSubmission
    submissionLoadState.error = null
    rpcMock.mockReset()
    promotePendingBikeTagPhotoMock.mockReset()
    deleteBikeTagPhotosMock.mockReset()
    deletePendingBikeTagPhotosMock.mockReset()

    promotePendingBikeTagPhotoMock
      .mockResolvedValueOnce({
        storagePath: 'tags/submission-123/match_photo_public.jpg',
        publicUrl: 'https://example.com/public/match.jpg'
      })
      .mockResolvedValueOnce({
        storagePath: 'tags/submission-123/tag_photo_public.jpg',
        publicUrl: 'https://example.com/public/next.jpg'
      })

    rpcMock.mockResolvedValue(successfulApprovalResponse)
    vi.stubGlobal('createError', createTestError)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('approveSubmissionInSupabase', () => {
    it('publishes private photos, approves the submission, and removes private originals', async () => {
      await expect(
        approveSubmissionInSupabase(validApproveSubmissionInput)
      ).resolves.toEqual({
        submissionId: 'submission-123',
        foundTagId: 'found-tag-456',
        currentTagId: 'current-tag-789'
      })

      expect(promotePendingBikeTagPhotoMock).toHaveBeenNthCalledWith(1, {
        storagePath: 'submissions/group-123/match_photo.jpg',
        submissionId: 'submission-123',
        photoType: 'match_photo'
      })
      expect(promotePendingBikeTagPhotoMock).toHaveBeenNthCalledWith(2, {
        storagePath: 'submissions/group-123/tag_photo.jpg',
        submissionId: 'submission-123',
        photoType: 'tag_photo'
      })
      expect(rpcMock).toHaveBeenCalledWith(
        'approve_submission_with_public_photos',
        {
          p_submission_id: 'submission-123',
          p_reviewed_by: 'Admin Rider',
          p_match_photo_url: 'https://example.com/public/match.jpg',
          p_next_tag_photo_url: 'https://example.com/public/next.jpg'
        }
      )
      expect(deletePendingBikeTagPhotosMock).toHaveBeenCalledWith([
        'submissions/group-123/match_photo.jpg',
        'submissions/group-123/tag_photo.jpg'
      ])
      expect(deleteBikeTagPhotosMock).not.toHaveBeenCalled()
    })

    it('approves legacy public-photo submissions without copying files', async () => {
      submissionLoadState.data = {
        id: 'submission-123',
        status: 'pending',
        match_photo_url: 'https://example.com/legacy/match.jpg',
        match_photo_storage_path: null,
        next_tag_photo_url: 'https://example.com/legacy/next.jpg',
        next_tag_photo_storage_path: null
      }

      await expect(
        approveSubmissionInSupabase(validApproveSubmissionInput)
      ).resolves.toMatchObject({
        submissionId: 'submission-123'
      })

      expect(promotePendingBikeTagPhotoMock).not.toHaveBeenCalled()
      expect(rpcMock).toHaveBeenCalledWith(
        'approve_submission_with_public_photos',
        expect.objectContaining({
          p_match_photo_url: 'https://example.com/legacy/match.jpg',
          p_next_tag_photo_url: 'https://example.com/legacy/next.jpg'
        })
      )
      expect(deletePendingBikeTagPhotosMock).not.toHaveBeenCalled()
    })

    it('rolls back the first public copy when the second photo cannot be published', async () => {
      promotePendingBikeTagPhotoMock
        .mockReset()
        .mockResolvedValueOnce({
          storagePath: 'tags/submission-123/match_photo_public.jpg',
          publicUrl: 'https://example.com/public/match.jpg'
        })
        .mockRejectedValueOnce(new Error('copy failed'))

      await expect(
        approveSubmissionInSupabase(validApproveSubmissionInput)
      ).rejects.toThrow('copy failed')

      expect(deleteBikeTagPhotosMock).toHaveBeenCalledWith([
        'tags/submission-123/match_photo_public.jpg'
      ])
      expect(rpcMock).not.toHaveBeenCalled()
      expect(deletePendingBikeTagPhotosMock).not.toHaveBeenCalled()
    })

    it('rolls back public copies when the approval transaction fails', async () => {
      rpcMock.mockResolvedValueOnce({
        data: null,
        error: {
          message: 'SUBMISSION_NOT_PENDING'
        }
      })

      await expect(
        approveSubmissionInSupabase(validApproveSubmissionInput)
      ).rejects.toMatchObject({
        statusCode: 409,
        statusMessage: 'Submission has already been reviewed.'
      })

      expect(deleteBikeTagPhotosMock).toHaveBeenCalledWith([
        'tags/submission-123/match_photo_public.jpg',
        'tags/submission-123/tag_photo_public.jpg'
      ])
      expect(deletePendingBikeTagPhotosMock).not.toHaveBeenCalled()
    })

    it('maps approved-submission uniqueness conflicts and rolls back copies', async () => {
      rpcMock.mockResolvedValueOnce({
        data: null,
        error: {
          code: '23505',
          message: 'duplicate key value violates unique constraint',
          details:
            'Key violates constraint one_approved_submission_per_active_tag.'
        }
      })

      await expect(
        approveSubmissionInSupabase(validApproveSubmissionInput)
      ).rejects.toMatchObject({
        statusCode: 409,
        statusMessage: 'This tag already has an approved submission.'
      })

      expect(deleteBikeTagPhotosMock).toHaveBeenCalledTimes(1)
    })

    it('does not publish photos when the submission is already reviewed', async () => {
      submissionLoadState.data = {
        ...privateSubmission,
        status: 'approved'
      }

      await expect(
        approveSubmissionInSupabase(validApproveSubmissionInput)
      ).rejects.toMatchObject({
        statusCode: 409,
        statusMessage: 'Submission has already been reviewed.'
      })

      expect(promotePendingBikeTagPhotoMock).not.toHaveBeenCalled()
      expect(rpcMock).not.toHaveBeenCalled()
    })

    it('does not fail approval when private-photo cleanup fails', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined)

      deletePendingBikeTagPhotosMock.mockRejectedValueOnce(
        new Error('private cleanup failed')
      )

      await expect(
        approveSubmissionInSupabase(validApproveSubmissionInput)
      ).resolves.toMatchObject({
        submissionId: 'submission-123'
      })

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Could not delete approved private submission photos.',
        expect.objectContaining({
          submissionId: 'submission-123'
        })
      )

      consoleErrorSpy.mockRestore()
    })
  })
})
