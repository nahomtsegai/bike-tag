import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { promotePendingBikeTagPhoto } from '../../server/utils/supabaseStorage'

const copyMock = vi.hoisted(() => vi.fn())
const getPublicUrlMock = vi.hoisted(() => vi.fn())
const removeMock = vi.hoisted(() => vi.fn())
const storageFromMock = vi.hoisted(() => vi.fn())
const createClientMock = vi.hoisted(() => vi.fn())

vi.mock('../../server/utils/supabase', () => ({
  createSupabaseServerClient: createClientMock
}))
vi.mock('../../server/utils/imageSanitization', () => ({
  sanitizeUploadedImage: vi.fn()
}))

const createTestError = ({ statusCode, statusMessage }: {
  statusCode: number
  statusMessage: string
}) => Object.assign(new Error(statusMessage), { statusCode, statusMessage })

describe('private photo promotion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storageFromMock.mockReturnValue({
      copy: copyMock,
      getPublicUrl: getPublicUrlMock,
      remove: removeMock
    })
    createClientMock.mockReturnValue({ storage: { from: storageFromMock } })
    copyMock.mockResolvedValue({ error: null })
    removeMock.mockResolvedValue({ error: null })
    getPublicUrlMock.mockReturnValue({ data: { publicUrl: 'https://example.test/photo.jpg' } })
    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'photo-id') })
    vi.stubGlobal('useRuntimeConfig', () => ({
      supabaseStorageBucket: 'bike_tag_photos',
      supabasePendingStorageBucket: 'bike_tag_pending_photos'
    }))
    vi.stubGlobal('createError', createTestError)
  })

  afterEach(() => vi.unstubAllGlobals())

  it('copies a pending JPEG to a public path', async () => {
    const result = await promotePendingBikeTagPhoto({
      storagePath: 'submissions/group/tag_photo_source.jpg',
      submissionId: 'submission-123',
      photoType: 'tag_photo'
    })

    expect(result.storagePath).toBe('tags/submission-123/tag_photo_photo-id.jpg')
    expect(copyMock).toHaveBeenCalledWith(
      'submissions/group/tag_photo_source.jpg',
      result.storagePath,
      { destinationBucket: 'bike_tag_photos' }
    )
  })

  it('rolls back a copy when no public URL is returned', async () => {
    getPublicUrlMock.mockReturnValueOnce({ data: {} })
    await expect(
      promotePendingBikeTagPhoto({
        storagePath: 'submissions/group/tag_photo_source.jpg',
        submissionId: 'submission-123',
        photoType: 'tag_photo'
      })
    ).rejects.toMatchObject({ statusCode: 500 })
    expect(removeMock).toHaveBeenCalledWith([
      'tags/submission-123/tag_photo_photo-id.jpg'
    ])
  })
})
