import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const {
  createSupabaseServerClientMock,
  getPublicUrlMock,
  sanitizeUploadedImageMock,
  storageFromMock,
  uploadMock
} = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
  getPublicUrlMock: vi.fn(),
  sanitizeUploadedImageMock: vi.fn(),
  storageFromMock: vi.fn(),
  uploadMock: vi.fn()
}))

vi.mock('../../server/utils/supabase', () => ({
  createSupabaseServerClient: createSupabaseServerClientMock
}))

vi.mock('../../server/utils/imageSanitization', () => ({
  sanitizeUploadedImage: sanitizeUploadedImageMock,
  sanitizedImageMimeType: 'image/webp'
}))

import {
  uploadBikeTagPhoto,
  uploadPendingBikeTagPhoto
} from '../../server/utils/supabaseStorage'

type CreateErrorInput = {
  statusCode: number
  statusMessage: string
}

const createTestError = ({ statusCode, statusMessage }: CreateErrorInput) => {
  const error = new Error(statusMessage) as Error & CreateErrorInput
  error.statusCode = statusCode
  error.statusMessage = statusMessage
  return error
}

const sourceJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43])
const sanitizedWebp = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x04, 0x00, 0x00, 0x00,
  0x57, 0x45, 0x42, 0x50
])

describe('Supabase photo upload sanitization', () => {
  beforeEach(() => {
    vi.stubGlobal('createError', createTestError)
    vi.stubGlobal('useRuntimeConfig', () => ({
      supabaseStorageBucket: 'bike_tag_photos',
      supabasePendingStorageBucket: 'bike_tag_pending_photos',
      adminPhotoSignedUrlTtlSeconds: 28_800
    }))

    uploadMock.mockReset()
    uploadMock.mockResolvedValue({ error: null })
    getPublicUrlMock.mockReset()
    getPublicUrlMock.mockReturnValue({
      data: { publicUrl: 'https://example.supabase.co/photo.webp' }
    })
    sanitizeUploadedImageMock.mockReset()
    sanitizeUploadedImageMock.mockResolvedValue({
      fileBuffer: sanitizedWebp,
      mimeType: 'image/webp',
      fileExtension: 'webp',
      width: 1200,
      height: 800,
      originalSizeInBytes: sourceJpeg.byteLength,
      sanitizedSizeInBytes: sanitizedWebp.byteLength
    })
    storageFromMock.mockReset()
    storageFromMock.mockReturnValue({
      upload: uploadMock,
      getPublicUrl: getPublicUrlMock
    })
    createSupabaseServerClientMock.mockReset()
    createSupabaseServerClientMock.mockReturnValue({
      storage: { from: storageFromMock }
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uploads only sanitized WebP bytes to the pending bucket', async () => {
    const result = await uploadPendingBikeTagPhoto({
      fileBuffer: sourceJpeg,
      fileName: 'match-photo.jpg',
      mimeType: 'image/jpeg',
      submissionGroupId: 'submission-group',
      photoType: 'match_photo'
    })

    expect(sanitizeUploadedImageMock).toHaveBeenCalledWith({
      fileBuffer: sourceJpeg
    })
    expect(storageFromMock).toHaveBeenCalledWith('bike_tag_pending_photos')
    expect(uploadMock).toHaveBeenCalledWith(
      expect.stringMatching(
        /^submissions\/submission-group\/match_photo_.+\.webp$/
      ),
      sanitizedWebp,
      { contentType: 'image/webp', upsert: false }
    )
    expect(result.storagePath).toMatch(/\.webp$/)
  })

  it('uploads only sanitized WebP bytes to the public bucket', async () => {
    const result = await uploadBikeTagPhoto({
      fileBuffer: sourceJpeg,
      fileName: 'next-tag.jpg',
      mimeType: 'image/jpeg',
      tagId: 'tag-123',
      photoType: 'tag_photo'
    })

    expect(storageFromMock).toHaveBeenCalledWith('bike_tag_photos')
    expect(uploadMock).toHaveBeenCalledWith(
      expect.stringMatching(/^tags\/tag-123\/tag_photo_.+\.webp$/),
      sanitizedWebp,
      { contentType: 'image/webp', upsert: false }
    )
    expect(result.publicUrl).toBe('https://example.supabase.co/photo.webp')
  })

  it('rejects a forged MIME declaration before processing or upload', async () => {
    await expect(
      uploadPendingBikeTagPhoto({
        fileBuffer: sourceJpeg,
        fileName: 'forged.png',
        mimeType: 'image/png',
        submissionGroupId: 'submission-group',
        photoType: 'match_photo'
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Photo contents do not match the declared image type.'
    })

    expect(sanitizeUploadedImageMock).not.toHaveBeenCalled()
    expect(uploadMock).not.toHaveBeenCalled()
  })

  it('does not upload when image processing fails', async () => {
    sanitizeUploadedImageMock.mockRejectedValue(
      createTestError({
        statusCode: 400,
        statusMessage: 'Photo could not be decoded.'
      })
    )

    await expect(
      uploadPendingBikeTagPhoto({
        fileBuffer: sourceJpeg,
        fileName: 'broken.jpg',
        mimeType: 'image/jpeg',
        submissionGroupId: 'submission-group',
        photoType: 'match_photo'
      })
    ).rejects.toMatchObject({ statusCode: 400 })

    expect(uploadMock).not.toHaveBeenCalled()
  })
})
