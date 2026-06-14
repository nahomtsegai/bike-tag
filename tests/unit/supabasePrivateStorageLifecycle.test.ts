import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  deletePendingBikeTagPhotos,
  promotePendingBikeTagPhoto,
  uploadPendingBikeTagPhoto
} from '../../server/utils/supabaseStorage'

type CreateErrorInput = {
  statusCode: number
  statusMessage: string
}

const uploadMock = vi.hoisted(() => vi.fn())
const copyMock = vi.hoisted(() => vi.fn())
const getPublicUrlMock = vi.hoisted(() => vi.fn())
const removeMock = vi.hoisted(() => vi.fn())
const storageFromMock = vi.hoisted(() => vi.fn())
const createSupabaseServerClientMock = vi.hoisted(() => vi.fn())

vi.mock('../../server/utils/supabase', () => {
  return {
    createSupabaseServerClient: createSupabaseServerClientMock
  }
})

const createTestError = ({ statusCode, statusMessage }: CreateErrorInput) => {
  const error = new Error(statusMessage) as Error & CreateErrorInput

  error.statusCode = statusCode
  error.statusMessage = statusMessage

  return error
}

const publicBucket = 'bike_tag_photos'
const pendingBucket = 'bike_tag_pending_photos'

describe('private Supabase photo lifecycle', () => {
  beforeEach(() => {
    uploadMock.mockReset()
    copyMock.mockReset()
    getPublicUrlMock.mockReset()
    removeMock.mockReset()
    storageFromMock.mockReset()
    createSupabaseServerClientMock.mockReset()

    storageFromMock.mockReturnValue({
      upload: uploadMock,
      copy: copyMock,
      getPublicUrl: getPublicUrlMock,
      remove: removeMock
    })
    createSupabaseServerClientMock.mockReturnValue({
      storage: {
        from: storageFromMock
      }
    })
    uploadMock.mockResolvedValue({ error: null })
    copyMock.mockResolvedValue({ error: null })
    removeMock.mockResolvedValue({ error: null })
    getPublicUrlMock.mockReturnValue({
      data: {
        publicUrl: 'https://example.supabase.co/public/published-photo.jpg'
      }
    })

    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => 'generated-photo-id')
    })
    vi.stubGlobal('useRuntimeConfig', () => {
      return {
        supabaseStorageBucket: publicBucket,
        supabasePendingStorageBucket: pendingBucket,
        adminPhotoSignedUrlTtlSeconds: 28800
      }
    })
    vi.stubGlobal('createError', createTestError)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uploads a new submission photo into the private pending bucket', async () => {
    await expect(
      uploadPendingBikeTagPhoto({
        fileBuffer: new Uint8Array([1, 2, 3]),
        fileName: 'match.jpg',
        mimeType: 'image/jpeg',
        submissionGroupId: 'group-123',
        photoType: 'match_photo'
      })
    ).resolves.toEqual({
      storageBucket: pendingBucket,
      storagePath:
        'submissions/group-123/match_photo_generated-photo-id.jpg'
    })

    expect(storageFromMock).toHaveBeenCalledWith(pendingBucket)
    expect(uploadMock).toHaveBeenCalledWith(
      'submissions/group-123/match_photo_generated-photo-id.jpg',
      new Uint8Array([1, 2, 3]),
      {
        contentType: 'image/jpeg',
        upsert: false
      }
    )
  })

  it('copies a pending photo to a unique public path for approval', async () => {
    await expect(
      promotePendingBikeTagPhoto({
        storagePath: 'submissions/group-123/tag_photo_source.webp',
        submissionId: 'submission-123',
        photoType: 'tag_photo'
      })
    ).resolves.toEqual({
      storageBucket: publicBucket,
      storagePath:
        'tags/submission-123/tag_photo_generated-photo-id.webp',
      publicUrl: 'https://example.supabase.co/public/published-photo.jpg'
    })

    expect(copyMock).toHaveBeenCalledWith(
      'submissions/group-123/tag_photo_source.webp',
      'tags/submission-123/tag_photo_generated-photo-id.webp',
      {
        destinationBucket: publicBucket
      }
    )
    expect(storageFromMock).toHaveBeenNthCalledWith(1, pendingBucket)
    expect(storageFromMock).toHaveBeenNthCalledWith(2, publicBucket)
  })

  it('maps copy failures to a server error', async () => {
    copyMock.mockResolvedValueOnce({
      error: {
        message: 'copy unavailable'
      }
    })

    await expect(
      promotePendingBikeTagPhoto({
        storagePath: 'submissions/group-123/tag_photo_source.jpg',
        submissionId: 'submission-123',
        photoType: 'tag_photo'
      })
    ).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'Could not publish pending photo: copy unavailable'
    })
  })

  it('removes the public copy when a public URL cannot be generated', async () => {
    getPublicUrlMock.mockReturnValueOnce({
      data: {}
    })

    await expect(
      promotePendingBikeTagPhoto({
        storagePath: 'submissions/group-123/tag_photo_source.jpg',
        submissionId: 'submission-123',
        photoType: 'tag_photo'
      })
    ).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'Supabase did not return a valid public photo URL.'
    })

    expect(removeMock).toHaveBeenCalledWith([
      'tags/submission-123/tag_photo_generated-photo-id.jpg'
    ])
  })

  it('deletes photos from the private pending bucket', async () => {
    await deletePendingBikeTagPhotos([
      'submissions/group-123/match.jpg',
      'submissions/group-123/next.jpg'
    ])

    expect(storageFromMock).toHaveBeenCalledWith(pendingBucket)
    expect(removeMock).toHaveBeenCalledWith([
      'submissions/group-123/match.jpg',
      'submissions/group-123/next.jpg'
    ])
  })

  it('skips private storage configuration when there are no paths to delete', async () => {
    vi.stubGlobal('useRuntimeConfig', () => {
      return {
        supabaseStorageBucket: publicBucket,
        supabasePendingStorageBucket: ''
      }
    })

    await expect(
      deletePendingBikeTagPhotos(['', '   '])
    ).resolves.toBeUndefined()

    expect(createSupabaseServerClientMock).not.toHaveBeenCalled()
  })
})
