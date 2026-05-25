import { describe, expect, it } from 'vitest'
import {
  getFileExtension,
  isAllowedImageExtension,
  isAllowedImageMimeType,
  isAllowedImageMimeTypeAndExtension,
  isAllowedImageSize,
  maxImageFileSizeInBytes
} from '~~/shared/utils/imageValidation'

describe('imageValidation', () => {
  describe('isAllowedImageMimeType', () => {
    it('allows jpg, png, and webp image MIME types', () => {
      expect(isAllowedImageMimeType('image/jpeg')).toBe(true)
      expect(isAllowedImageMimeType('image/png')).toBe(true)
      expect(isAllowedImageMimeType('image/webp')).toBe(true)
    })

    it('rejects unsupported MIME types', () => {
      expect(isAllowedImageMimeType('image/gif')).toBe(false)
      expect(isAllowedImageMimeType('application/pdf')).toBe(false)
      expect(isAllowedImageMimeType('')).toBe(false)
    })
  })

  describe('isAllowedImageSize', () => {
    it('allows files larger than zero bytes and no larger than the max size', () => {
      expect(isAllowedImageSize(1)).toBe(true)
      expect(isAllowedImageSize(maxImageFileSizeInBytes)).toBe(true)
    })

    it('rejects empty and oversized files', () => {
      expect(isAllowedImageSize(0)).toBe(false)
      expect(isAllowedImageSize(maxImageFileSizeInBytes + 1)).toBe(false)
    })
  })

  describe('getFileExtension', () => {
    it('returns a lowercase file extension', () => {
      expect(getFileExtension('photo.JPG')).toBe('jpg')
      expect(getFileExtension('tag.Photo.PNG')).toBe('png')
    })

    it('returns an empty string when no extension exists', () => {
      expect(getFileExtension('photo')).toBe('')
      expect(getFileExtension('')).toBe('')
    })
  })

  describe('isAllowedImageExtension', () => {
    it('allows jpg, jpeg, png, and webp extensions', () => {
      expect(isAllowedImageExtension('photo.jpg')).toBe(true)
      expect(isAllowedImageExtension('photo.jpeg')).toBe(true)
      expect(isAllowedImageExtension('photo.png')).toBe(true)
      expect(isAllowedImageExtension('photo.webp')).toBe(true)
    })

    it('rejects unsupported extensions', () => {
      expect(isAllowedImageExtension('photo.gif')).toBe(false)
      expect(isAllowedImageExtension('photo.pdf')).toBe(false)
      expect(isAllowedImageExtension('photo')).toBe(false)
    })
  })

  describe('isAllowedImageMimeTypeAndExtension', () => {
    it('allows matching MIME type and extension pairs', () => {
      expect(
        isAllowedImageMimeTypeAndExtension('image/jpeg', 'photo.jpg')
      ).toBe(true)

      expect(
        isAllowedImageMimeTypeAndExtension('image/jpeg', 'photo.jpeg')
      ).toBe(true)

      expect(
        isAllowedImageMimeTypeAndExtension('image/png', 'photo.png')
      ).toBe(true)

      expect(
        isAllowedImageMimeTypeAndExtension('image/webp', 'photo.webp')
      ).toBe(true)
    })

    it('rejects mismatched MIME type and extension pairs', () => {
      expect(
        isAllowedImageMimeTypeAndExtension('image/jpeg', 'photo.png')
      ).toBe(false)

      expect(
        isAllowedImageMimeTypeAndExtension('image/png', 'photo.webp')
      ).toBe(false)

      expect(
        isAllowedImageMimeTypeAndExtension('image/webp', 'photo.jpg')
      ).toBe(false)
    })

    it('rejects unsupported MIME types even when the extension looks valid', () => {
      expect(
        isAllowedImageMimeTypeAndExtension('image/gif', 'photo.jpg')
      ).toBe(false)
    })
  })
})