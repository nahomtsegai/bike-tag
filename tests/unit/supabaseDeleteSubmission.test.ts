import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { deletePendingSubmissionFromSupabase } from '../../server/utils/supabaseDeleteSubmission'

type CreateErrorInput = {
  statusCode: number
  statusMessage: string
}

type TableMockState = {
  loadData: unknown
  loadError: { message: string } | null
  deleteData: unknown
  deleteError: { message: string } | null
}

const tableMockState = vi.hoisted<TableMockState>(() => ({
  loadData: null,
  loadError: null,
  deleteData: null,
  deleteError: null
}))

const deleteBikeTagPhotosMock = vi.hoisted(() => vi.fn())
const deletePendingBikeTagPhotosMock = vi.hoisted(() => vi.fn())

vi.mock('../../server/utils/supabaseStorage', () => {
  return {
    getStoragePathFromPublicUrl: (publicUrl: string) => {
      const marker = '/storage/v1/object/public/bike_tag_photos/'
      const markerIndex = publicUrl.indexOf(marker)

      if (markerIndex === -1) {
        return ''
      }

      return publicUrl.slice(markerIndex + marker.length)
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
                    maybeSingle: async () => {
                      return {
                        data: tableMockState.loadData,
                        error: tableMockState.loadError
                      }
                    }
                  }
                }
              }
            },
            delete: () => {
              return {
                eq: () => {
                  return {
                    in: () => {
                      return {
                        select: () => {
                          return {
                            maybeSingle: async () => {
                              return {
                                data: tableMockState.deleteData,
                                error: tableMockState.deleteError
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
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

const matchPhotoUrl =
  'https://example.supabase.co/storage/v1/object/public/bike_tag_photos/tags/submission-123/match_photo.png'

const nextTagPhotoUrl =
  'https://example.supabase.co/storage/v1/object/public/bike_tag_photos/tags/submission-123/tag_photo.png'

const privateSubmission = {
  id: 'submission-123',
  status: 'pending',
  match_photo_url: null,
  match_photo_storage_path: 'submissions/group-123/match_photo.png',
  next_tag_photo_url: null,
  next_tag_photo_storage_path: 'submissions/group-123/tag_photo.png'
}

describe('supabaseDeleteSubmission', () => {
  beforeEach(() => {
    tableMockState.loadData = privateSubmission
    tableMockState.loadError = null
    tableMockState.deleteData = {
      id: 'submission-123'
    }
    tableMockState.deleteError = null

    deleteBikeTagPhotosMock.mockReset()
    deletePendingBikeTagPhotosMock.mockReset()
    vi.stubGlobal('createError', createTestError)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('deletePendingSubmissionFromSupabase', () => {
    it('deletes private pending photos after the DB row is deleted', async () => {
      await expect(
        deletePendingSubmissionFromSupabase({
          submissionId: 'submission-123'
        })
      ).resolves.toEqual({
        submissionId: 'submission-123'
      })

      expect(deletePendingBikeTagPhotosMock).toHaveBeenCalledWith([
        'submissions/group-123/match_photo.png',
        'submissions/group-123/tag_photo.png'
      ])
      expect(deleteBikeTagPhotosMock).not.toHaveBeenCalled()
    })

    it('deletes legacy public photos for older pending submissions', async () => {
      tableMockState.loadData = {
        id: 'submission-123',
        status: 'pending',
        match_photo_url: matchPhotoUrl,
        match_photo_storage_path: null,
        next_tag_photo_url: nextTagPhotoUrl,
        next_tag_photo_storage_path: null
      }

      await expect(
        deletePendingSubmissionFromSupabase({
          submissionId: 'submission-123'
        })
      ).resolves.toEqual({
        submissionId: 'submission-123'
      })

      expect(deleteBikeTagPhotosMock).toHaveBeenCalledWith([
        'tags/submission-123/match_photo.png',
        'tags/submission-123/tag_photo.png'
      ])
      expect(deletePendingBikeTagPhotosMock).not.toHaveBeenCalled()
    })

    it('allows rejected submissions to be deleted with private cleanup', async () => {
      tableMockState.loadData = {
        ...privateSubmission,
        status: 'rejected'
      }

      await expect(
        deletePendingSubmissionFromSupabase({
          submissionId: 'submission-123'
        })
      ).resolves.toEqual({
        submissionId: 'submission-123'
      })

      expect(deletePendingBikeTagPhotosMock).toHaveBeenCalledTimes(1)
    })

    it('does not clean up photos when the DB row was not deleted', async () => {
      tableMockState.deleteData = null

      await expect(
        deletePendingSubmissionFromSupabase({
          submissionId: 'submission-123'
        })
      ).rejects.toMatchObject({
        statusCode: 409,
        statusMessage:
          'Submission was not deleted because it is no longer pending or rejected.'
      })

      expect(deleteBikeTagPhotosMock).not.toHaveBeenCalled()
      expect(deletePendingBikeTagPhotosMock).not.toHaveBeenCalled()
    })

    it('does not delete approved submissions or clean up photos', async () => {
      tableMockState.loadData = {
        ...privateSubmission,
        status: 'approved'
      }

      await expect(
        deletePendingSubmissionFromSupabase({
          submissionId: 'submission-123'
        })
      ).rejects.toMatchObject({
        statusCode: 409,
        statusMessage: 'Only pending or rejected submissions can be deleted.'
      })

      expect(deleteBikeTagPhotosMock).not.toHaveBeenCalled()
      expect(deletePendingBikeTagPhotosMock).not.toHaveBeenCalled()
    })

    it('returns not found when the submission does not exist', async () => {
      tableMockState.loadData = null

      await expect(
        deletePendingSubmissionFromSupabase({
          submissionId: 'missing-submission'
        })
      ).rejects.toMatchObject({
        statusCode: 404,
        statusMessage: 'Submission was not found.'
      })

      expect(deleteBikeTagPhotosMock).not.toHaveBeenCalled()
      expect(deletePendingBikeTagPhotosMock).not.toHaveBeenCalled()
    })

    it('does not fail deletion when private photo cleanup fails', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined)

      deletePendingBikeTagPhotosMock.mockRejectedValueOnce(
        new Error('storage cleanup failed')
      )

      await expect(
        deletePendingSubmissionFromSupabase({
          submissionId: 'submission-123'
        })
      ).resolves.toEqual({
        submissionId: 'submission-123'
      })

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Could not delete private pending submission photos.',
        expect.objectContaining({
          submissionId: 'submission-123',
          storagePaths: [
            'submissions/group-123/match_photo.png',
            'submissions/group-123/tag_photo.png'
          ]
        })
      )

      consoleErrorSpy.mockRestore()
    })
  })
})
