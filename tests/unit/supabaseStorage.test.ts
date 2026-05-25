import { describe, expect, it } from 'vitest'
import { getStoragePathFromPublicUrl } from '../../server/utils/supabaseStorage'

const storageBucket = 'bike_tag_photos'

describe('supabaseStorage', () => {
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
})