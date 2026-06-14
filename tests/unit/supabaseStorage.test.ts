import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createAdminPhotoSignedUrl,
  getStoragePathFromPublicUrl,
  resolveAdminPhotoUrl
} from '../../server/utils/supabaseStorage'

type CreateErrorInput = {
  statusCode: number
  statusMessage: string
}

const createSignedUrlMock = vi.hoisted(() => vi.fn())
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

const storageBucket = 'bike_tag_photos'
const pendingStorageBucket = 'bike_tag_pending_photos'

const stubRuntimeConfig = ({
  pendingBucket = pendingStorageBucket,
  ttlSeconds = 28800
}: {
  pendingBucket?: unknown
  ttlSeconds?: unknown
} = {}) => {
  vi.stubGlobal('useRuntimeConfig', () => {
    return {
      supabaseStorageBucket: storageBucket,
      supabasePendingStorageBucket: pendingBucket,
      adminPhotoSignedUrlTtlSeconds: ttlSeconds
    }
  })
}

describe('supabaseStorage', () => {
  beforeEach(() => {
    createSignedUrlMock.mockReset()
    storageFromMock.mockReset()
    createSupabaseServerClientMock.mockReset()

    storageFromMock.mockReturnValue({
      createSignedUrl: createSignedUrlMock
    })

    createSupabaseServerClientMock.mockReturnValue({
      storage: {
        from: storageFromMock
      }
    })

    stubRuntimeConfig()
    vi.stubGlobal('createError', createTestError)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('getStoragePathFromPublicUrl', () => {
    it('returns the storage path from a Supabase public URL', () => {
      const publicUrl =
        'https://example.supabase.co/storage/v1/object/public/bike_tag_photos/tags/abc/tag_photo_123.png'

      expect(getStoragePathFromPublicUrl(publicUrl, storageBucket)).toBe(
        'tags/abc/tag_photo_123.png'
      )
    })

    it('returns the storage path when the URL has query parameters', () => {
      const publicUrl =
        'https://example.supabase.co/storage/v1/object/public/bike_tag_photos/tags/abc/match_photo_123.webp?t=123'

      expect(getStoragePathFromPublicUrl(publicUrl, storageBucket)).toBe(
        'tags/abc/match_photo_123.webp'
      )
    })

    it('decodes encoded storage paths', () => {
      const publicUrl =
        'https://example.supabase.co/storage/v1/object/public/bike_tag_photos/tags/folder%20with%20spaces/tag_photo_123.png'

      expect(getStoragePathFromPublicUrl(publicUrl, storageBucket)).toBe(
        'tags/folder with spaces/tag_photo_123.png'
      )
    })

    it('returns an empty string for an empty URL', () => {
      expect(getStoragePathFromPublicUrl('', storageBucket)).toBe('')
      expect(getStoragePathFromPublicUrl('   ', storageBucket)).toBe('')
    })

    it('returns an empty string when the bucket does not match', () => {
      const publicUrl =
        'https://example.supabase.co/storage/v1/object/public/other_bucket/tags/abc/tag_photo_123.png'

      expect(getStoragePathFromPublicUrl(publicUrl, storageBucket)).toBe('')
    })

    it('returns an empty string for a non Supabase public storage URL', () => {
      const publicUrl = 'https://example.com/tags/abc/tag_photo_123.png'

      expect(getStoragePathFromPublicUrl(publicUrl, storageBucket)).toBe('')
    })
  })

  describe('createAdminPhotoSignedUrl', () => {
    it('creates an eight-hour signed URL from the private pending bucket', async () => {
      createSignedUrlMock.mockResolvedValueOnce({
        data: {
          signedUrl: 'https://example.supabase.co/signed/match-photo'
        },
        error: null
      })

      await expect(
        createAdminPhotoSignedUrl({
          storagePath: ' submissions/abc/match-photo.jpg '
        })
      ).resolves.toBe('https://example.supabase.co/signed/match-photo')

      expect(storageFromMock).toHaveBeenCalledWith(pendingStorageBucket)
      expect(createSignedUrlMock).toHaveBeenCalledWith(
        'submissions/abc/match-photo.jpg',
        28800
      )
    })

    it('does not call Supabase for an empty storage path', async () => {
      await expect(
        createAdminPhotoSignedUrl({
          storagePath: '   '
        })
      ).resolves.toBe('')

      expect(createSupabaseServerClientMock).not.toHaveBeenCalled()
    })

    it('throws when the pending bucket is missing', async () => {
      stubRuntimeConfig({
        pendingBucket: ''
      })

      await expect(
        createAdminPhotoSignedUrl({
          storagePath: 'submissions/abc/match-photo.jpg'
        })
      ).rejects.toMatchObject({
        statusCode: 500,
        statusMessage:
          'Missing required environment variable: NUXT_SUPABASE_PENDING_STORAGE_BUCKET'
      })
    })

    it('throws when the configured signed URL lifetime is invalid', async () => {
      stubRuntimeConfig({
        ttlSeconds: 'not-a-number'
      })

      await expect(
        createAdminPhotoSignedUrl({
          storagePath: 'submissions/abc/match-photo.jpg'
        })
      ).rejects.toMatchObject({
        statusCode: 500,
        statusMessage:
          'NUXT_ADMIN_PHOTO_SIGNED_URL_TTL_SECONDS must be a positive integer.'
      })
    })

    it('maps Supabase signed URL failures to server errors', async () => {
      createSignedUrlMock.mockResolvedValueOnce({
        data: null,
        error: {
          message: 'storage unavailable'
        }
      })

      await expect(
        createAdminPhotoSignedUrl({
          storagePath: 'submissions/abc/match-photo.jpg'
        })
      ).rejects.toMatchObject({
        statusCode: 500,
        statusMessage: 'Could not create admin photo URL: storage unavailable'
      })
    })

    it('throws when Supabase does not return a signed URL', async () => {
      createSignedUrlMock.mockResolvedValueOnce({
        data: {},
        error: null
      })

      await expect(
        createAdminPhotoSignedUrl({
          storagePath: 'submissions/abc/match-photo.jpg'
        })
      ).rejects.toMatchObject({
        statusCode: 500,
        statusMessage: 'Supabase did not return a valid admin photo URL.'
      })
    })
  })

  describe('resolveAdminPhotoUrl', () => {
    it('prefers a signed private URL when a storage path is present', async () => {
      createSignedUrlMock.mockResolvedValueOnce({
        data: {
          signedUrl: 'https://example.supabase.co/signed/private-photo'
        },
        error: null
      })

      await expect(
        resolveAdminPhotoUrl({
          publicUrl: 'https://example.com/legacy-public-photo.jpg',
          storagePath: 'submissions/abc/private-photo.jpg'
        })
      ).resolves.toBe('https://example.supabase.co/signed/private-photo')
    })

    it('returns the legacy public URL when no private path exists', async () => {
      await expect(
        resolveAdminPhotoUrl({
          publicUrl: ' https://example.com/legacy-public-photo.jpg ',
          storagePath: null
        })
      ).resolves.toBe('https://example.com/legacy-public-photo.jpg')

      expect(createSupabaseServerClientMock).not.toHaveBeenCalled()
    })

    it('returns an empty string when neither photo reference exists', async () => {
      await expect(
        resolveAdminPhotoUrl({
          publicUrl: null,
          storagePath: null
        })
      ).resolves.toBe('')
    })
  })
})
