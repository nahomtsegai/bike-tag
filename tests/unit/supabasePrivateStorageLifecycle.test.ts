import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  deletePendingBikeTagPhotos,
  promotePendingBikeTagPhoto,
  uploadPendingBikeTagPhoto
} from '../../server/utils/supabaseStorage'

const mocks = vi.hoisted(() => ({
  upload: vi.fn(),
  copy: vi.fn(),
  getPublicUrl: vi.fn(),
  remove: vi.fn(),
  from: vi.fn(),
  client: vi.fn(),
  sanitize: vi.fn()
}))

vi.mock('../../server/utils/supabase', () => ({
  createSupabaseServerClient: mocks.client
}))
vi.mock('../../server/utils/imageSanitization', () => ({
  sanitizeUploadedImage: mocks.sanitize,
  sanitizedImageMimeType: 'image/webp'
}))

const createErrorMock = ({ statusCode, statusMessage }: {
  statusCode: number
  statusMessage: string
}) => Object.assign(new Error(statusMessage), { statusCode, statusMessage })

const sourceJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xdb])
const sanitizedWebp = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x04, 0, 0, 0, 0x57, 0x45, 0x42, 0x50
])

describe('private Supabase photo lifecycle', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset())
    mocks.from.mockReturnValue({
      upload: mocks.upload,
      copy: mocks.copy,
      getPublicUrl: mocks.getPublicUrl,
      remove: mocks.remove
    })
    mocks.client.mockReturnValue({ storage: { from: mocks.from } })
    mocks.upload.mockResolvedValue({ error: null })
    mocks.copy.mockResolvedValue({ error: null })
    mocks.remove.mockResolvedValue({ error: null })
    mocks.getPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://example.supabase.co/public/photo.webp' }
    })
    mocks.sanitize.mockResolvedValue({
      fileBuffer: sanitizedWebp,
      mimeType: 'image/webp',
      fileExtension: 'webp',
      width: 1200,
      height: 800,
      originalSizeInBytes: sourceJpeg.byteLength,
      sanitizedSizeInBytes: sanitizedWebp.byteLength
    })
    vi.stubGlobal('crypto', { randomUUID: () => 'generated-photo-id' })
    vi.stubGlobal('useRuntimeConfig', () => ({
      supabaseStorageBucket: 'bike_tag_photos',
      supabasePendingStorageBucket: 'bike_tag_pending_photos',
      adminPhotoSignedUrlTtlSeconds: 28800
    }))
    vi.stubGlobal('createError', createErrorMock)
  })

  afterEach(() => vi.unstubAllGlobals())

  it('uploads sanitized WebP bytes to the private bucket', async () => {
    await expect(uploadPendingBikeTagPhoto({
      fileBuffer: sourceJpeg,
      fileName: 'match.jpg',
      mimeType: 'image/jpeg',
      submissionGroupId: 'group-123',
      photoType: 'match_photo'
    })).resolves.toEqual({
      storageBucket: 'bike_tag_pending_photos',
      storagePath: 'submissions/group-123/match_photo_generated-photo-id.webp'
    })
    expect(mocks.upload).toHaveBeenCalledWith(
      'submissions/group-123/match_photo_generated-photo-id.webp',
      sanitizedWebp,
      { contentType: 'image/webp', upsert: false }
    )
  })

  it('copies a pending photo to a unique public path', async () => {
    await promotePendingBikeTagPhoto({
      storagePath: 'submissions/group-123/tag_photo_source.webp',
      submissionId: 'submission-123',
      photoType: 'tag_photo'
    })
    expect(mocks.copy).toHaveBeenCalledWith(
      'submissions/group-123/tag_photo_source.webp',
      'tags/submission-123/tag_photo_generated-photo-id.webp',
      { destinationBucket: 'bike_tag_photos' }
    )
  })

  it('maps copy failures to a server error', async () => {
    mocks.copy.mockResolvedValueOnce({ error: { message: 'copy unavailable' } })
    await expect(promotePendingBikeTagPhoto({
      storagePath: 'submissions/group-123/tag_photo_source.jpg',
      submissionId: 'submission-123',
      photoType: 'tag_photo'
    })).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'Could not publish pending photo: copy unavailable'
    })
  })

  it('rolls back a public copy when no public URL is returned', async () => {
    mocks.getPublicUrl.mockReturnValueOnce({ data: {} })
    await expect(promotePendingBikeTagPhoto({
      storagePath: 'submissions/group-123/tag_photo_source.jpg',
      submissionId: 'submission-123',
      photoType: 'tag_photo'
    })).rejects.toMatchObject({ statusCode: 500 })
    expect(mocks.remove).toHaveBeenCalledWith([
      'tags/submission-123/tag_photo_generated-photo-id.jpg'
    ])
  })

  it('skips storage configuration when no paths need deletion', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      supabaseStorageBucket: 'bike_tag_photos',
      supabasePendingStorageBucket: ''
    }))
    await expect(deletePendingBikeTagPhotos(['', '   '])).resolves.toBeUndefined()
    expect(mocks.client).not.toHaveBeenCalled()
  })
})
