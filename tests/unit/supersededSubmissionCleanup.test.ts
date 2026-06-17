import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { approveSubmissionInSupabase } from '../../server/utils/supabaseApproveSubmission'

type CreateErrorInput = {
  statusCode: number
  statusMessage: string
}

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
                      return {
                        data: {
                          id: 'submission-winner',
                          status: 'pending',
                          match_photo_url: null,
                          match_photo_storage_path:
                            'submissions/winner/match_photo.jpg',
                          next_tag_photo_url: null,
                          next_tag_photo_storage_path:
                            'submissions/winner/tag_photo.jpg'
                        },
                        error: null
                      }
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

describe('superseded submission cleanup', () => {
  beforeEach(() => {
    rpcMock.mockReset()
    promotePendingBikeTagPhotoMock.mockReset()
    deleteBikeTagPhotosMock.mockReset()
    deletePendingBikeTagPhotosMock.mockReset()

    promotePendingBikeTagPhotoMock
      .mockResolvedValueOnce({
        storagePath: 'tags/submission-winner/match_photo.jpg',
        publicUrl: 'https://example.com/public/match.jpg'
      })
      .mockResolvedValueOnce({
        storagePath: 'tags/submission-winner/tag_photo.jpg',
        publicUrl: 'https://example.com/public/next.jpg'
      })

    rpcMock.mockResolvedValueOnce({
      data: [
        {
          submission_id: 'submission-winner',
          found_tag_id: 'tag-found',
          current_tag_id: 'tag-current',
          superseded_submissions: [
            {
              submission_id: 'submission-loser',
              match_photo_storage_path:
                'submissions/loser/match_photo.jpg',
              next_tag_photo_storage_path:
                'submissions/loser/tag_photo.jpg'
            }
          ]
        }
      ],
      error: null
    })

    vi.stubGlobal('createError', createTestError)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('removes private photos for the winner and superseded competitors', async () => {
    await expect(
      approveSubmissionInSupabase({
        submissionId: 'submission-winner',
        reviewedBy: 'Admin Rider'
      })
    ).resolves.toEqual({
      submissionId: 'submission-winner',
      foundTagId: 'tag-found',
      currentTagId: 'tag-current'
    })

    expect(rpcMock).toHaveBeenCalledWith(
      'approve_submission_with_public_photos',
      expect.any(Object)
    )
    expect(deletePendingBikeTagPhotosMock).toHaveBeenNthCalledWith(1, [
      'submissions/winner/match_photo.jpg',
      'submissions/winner/tag_photo.jpg'
    ])
    expect(deletePendingBikeTagPhotosMock).toHaveBeenNthCalledWith(2, [
      'submissions/loser/match_photo.jpg',
      'submissions/loser/tag_photo.jpg'
    ])
    expect(deleteBikeTagPhotosMock).not.toHaveBeenCalled()
  })
})
