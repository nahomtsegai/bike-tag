import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { deletePendingBikeTagPhotos } from '../../server/utils/supabaseStorage'

const removeMock = vi.hoisted(() => vi.fn())
const storageFromMock = vi.hoisted(() => vi.fn())
const createClientMock = vi.hoisted(() => vi.fn())

vi.mock('../../server/utils/supabase', () => ({
  createSupabaseServerClient: createClientMock
}))
vi.mock('../../server/utils/imageSanitization', () => ({
  sanitizeUploadedImage: vi.fn()
}))

describe('private photo cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storageFromMock.mockReturnValue({ remove: removeMock })
    createClientMock.mockReturnValue({ storage: { from: storageFromMock } })
    removeMock.mockResolvedValue({ error: null })
    vi.stubGlobal('useRuntimeConfig', () => ({
      supabasePendingStorageBucket: 'bike_tag_pending_photos'
    }))
    vi.stubGlobal('createError', ({ statusCode, statusMessage }: {
      statusCode: number
      statusMessage: string
    }) => Object.assign(new Error(statusMessage), { statusCode, statusMessage }))
  })

  afterEach(() => vi.unstubAllGlobals())

  it('deletes photos from the private pending bucket', async () => {
    const paths = [
      'submissions/group/match.jpg',
      'submissions/group/next.jpg'
    ]
    await deletePendingBikeTagPhotos(paths)
    expect(storageFromMock).toHaveBeenCalledWith('bike_tag_pending_photos')
    expect(removeMock).toHaveBeenCalledWith(paths)
  })

  it('does not require storage configuration for empty paths', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      supabasePendingStorageBucket: ''
    }))
    await expect(deletePendingBikeTagPhotos(['', '   '])).resolves.toBeUndefined()
    expect(createClientMock).not.toHaveBeenCalled()
  })
})
