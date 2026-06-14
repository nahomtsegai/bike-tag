import { describe, expect, it } from 'vitest'
import {
  allowedImageFileTypesLabel,
  doesImageContentMatchMimeType,
  getFileExtension,
  isAllowedImageExtension,
  isAllowedImageMimeType,
  isAllowedImageMimeTypeAndExtension,
  isAllowedCombinedSubmitPhotoSize,
  isAllowedImageSize,
  isAllowedSourceImageSize,
  maxCombinedSubmitPhotoSizeInBytes,
  maxCombinedSubmitPhotoSizeLabel,
  maxImageFileSizeInBytes,
  maxImageFileSizeLabel,
  maxSourceImageFileSizeInBytes,
  maxSourceImageFileSizeLabel
} from '~~/shared/utils/imageValidation'

describe('imageValidation', () => {
  describe('labels', () => {
    it('exposes user friendly upload labels', () => {
      expect(allowedImageFileTypesLabel).toBe('JPG, PNG, or WebP')
      expect(maxImageFileSizeLabel).toBe('8 MB')
      expect(maxSourceImageFileSizeLabel).toBe('25 MB')
      expect(maxCombinedSubmitPhotoSizeLabel).toBe('4 MB')
    })
  })


  describe('doesImageContentMatchMimeType', () => {
    it('accepts matching JPEG, PNG, and WebP file signatures', () => {
      expect(
        doesImageContentMatchMimeType(
          'image/jpeg',
          new Uint8Array([0xff, 0xd8, 0xff, 0xe0])
        )
      ).toBe(true)

      expect(
        doesImageContentMatchMimeType(
          'image/png',
          new Uint8Array([
            0x89,
            0x50,
            0x4e,
            0x47,
            0x0d,
            0x0a,
            0x1a,
            0x0a
          ])
        )
      ).toBe(true)

      expect(
        doesImageContentMatchMimeType(
          'image/webp',
          new Uint8Array([
            0x52,
            0x49,
            0x46,
            0x46,
            0x00,
            0x00,
            0x00,
            0x00,
            0x57,
            0x45,
            0x42,
            0x50
          ])
        )
      ).toBe(true)
    })

    it('rejects content that does not match the declared MIME type', () => {
      const pngFileBuffer = new Uint8Array([
        0x89,
        0x50,
        0x4e,
        0x47,
        0x0d,
        0x0a,
        0x1a,
        0x0a
      ])

      expect(
        doesImageContentMatchMimeType('image/jpeg', pngFileBuffer)
      ).toBe(false)
      expect(
        doesImageContentMatchMimeType(
          'image/webp',
          new TextEncoder().encode('not an image')
        )
      ).toBe(false)
    })

    it('rejects unsupported MIME types and incomplete signatures', () => {
      expect(
        doesImageContentMatchMimeType(
          'image/gif',
          new Uint8Array([0x47, 0x49, 0x46])
        )
      ).toBe(false)
      expect(
        doesImageContentMatchMimeType(
          'image/png',
          new Uint8Array([0x89, 0x50, 0x4e])
        )
      ).toBe(false)
    })
  })

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

  describe('isAllowedSourceImageSize', () => {
    it('allows larger source photos that will be compressed in the browser', () => {
      expect(isAllowedSourceImageSize(maxImageFileSizeInBytes + 1)).toBe(true)
      expect(isAllowedSourceImageSize(maxSourceImageFileSizeInBytes)).toBe(true)
    })

    it('rejects empty and oversized source photos', () => {
      expect(isAllowedSourceImageSize(0)).toBe(false)
      expect(
        isAllowedSourceImageSize(maxSourceImageFileSizeInBytes + 1)
      ).toBe(false)
    })
  })

  describe('isAllowedCombinedSubmitPhotoSize', () => {
    it('allows two prepared photos within the combined request budget', () => {
      expect(
        isAllowedCombinedSubmitPhotoSize(
          1_500_000,
          maxCombinedSubmitPhotoSizeInBytes - 1_500_000
        )
      ).toBe(true)
    })

    it('rejects empty photos and pairs above the combined request budget', () => {
      expect(isAllowedCombinedSubmitPhotoSize(0, 1_000_000)).toBe(false)
      expect(
        isAllowedCombinedSubmitPhotoSize(
          2_000_001,
          2_000_000
        )
      ).toBe(false)
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

    it('allows uppercase file extensions when the MIME type matches', () => {
      expect(
        isAllowedImageMimeTypeAndExtension('image/jpeg', 'photo.JPG')
      ).toBe(true)

      expect(
        isAllowedImageMimeTypeAndExtension('image/png', 'photo.PNG')
      ).toBe(true)

      expect(
        isAllowedImageMimeTypeAndExtension('image/webp', 'photo.WEBP')
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

    it('rejects missing file extensions even when the MIME type is allowed', () => {
      expect(
        isAllowedImageMimeTypeAndExtension('image/jpeg', 'photo')
      ).toBe(false)
    })
  })
})