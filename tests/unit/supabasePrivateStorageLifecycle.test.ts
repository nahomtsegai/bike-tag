import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { uploadPendingBikeTagPhoto } from '../../server/utils/supabaseStorage'

const uploadMock = vi.hoisted(() => vi.fn())
const storageFromMock = vi.hoisted(() => vi.fn())
const createClientMock = vi.hoisted(() => vi.fn())
const sanitizeMock = vi.hoisted(() => vi.fn())

vi.mock('../../server/utils/supabase', () => ({
  createSupabaseServerClient: createClientMock
}))
vi.mock('../../server/utils/imageSanitization', () => ({
  sanitizeUploadedImage: sanitizeMock
}))

const createTestError = ({ statusCode, statusMessage }: {
  statusCode: number
  statusMessage: string
}) => Object.assign(new Error(statusMessage), { statusCode, statusMessage })

describe('private Supabase photo upload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storageFromMock.mockReturnValue({ upload: uploadMock })
    createClientMock.mockReturnValue({ storage: { from: storageFromMock } })
    sanitizeMock.mockResolvedValue({
      fileBuffer: new Uint8Array([9, 8, 7]),
      fileName: 'match-sanitized.jpg',
      mimeType: 'image/jpeg',
      sourceFormat: 'jpeg',
      sourceWidth: 2000,
      sourceHeight: 1000,
      sourceSize: 3,
      sourceHadMetadata: true,
      outputWidth: 1600,
      outputHeight: 800,
      outputSize: 3
    })
    uploadMock.mockResolvedValue({ error: null })
    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'photo-id') })
    vi.stubGlobal('useRuntimeConfig', () => ({
      supabasePendingStorageBucket: 'bike_tag_pending_photos'
    }))
    vi.stubGlobal('createError', createTestError)
  })

  afterEach(() => vi.unstubAllGlobals())

  it('stores only the sanitized JPEG bytes', async () => {
    const result = await uploadPendingBikeTagPhoto({
      fileBuffer: new Uint8Array([1, 2, 3]),
      fileName: 'match.jpg',
      mimeType: 'image/jpeg',
      submissionGroupId: 'group-123',
      photoType: 'match_photo'
    })

    expect(sanitizeMock).toHaveBeenCalledOnce()
    expect(uploadMock).toHaveBeenCalledWith(
      result.storagePath,
      new Uint8Array([9, 8, 7]),
      { contentType: 'image/jpeg', upsert: false }
    )
    expect(result.storagePath).toMatch(/\.jpg$/)
  })

  it('does not reach storage when sanitization fails', async () => {
    sanitizeMock.mockRejectedValueOnce(
      createTestError({ statusCode: 400, statusMessage: 'Invalid image.' })
    )

    await expect(
      uploadPendingBikeTagPhoto({
        fileBuffer: new Uint8Array([1, 2, 3]),
        fileName: 'match.jpg',
        mimeType: 'image/jpeg',
        submissionGroupId: 'group-123',
        photoType: 'match_photo'
      })
    ).rejects.toMatchObject({ statusCode: 400 })
    expect(uploadMock).not.toHaveBeenCalled()
  })
})
