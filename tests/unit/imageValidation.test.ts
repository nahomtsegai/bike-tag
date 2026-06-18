import { describe, expect, it } from 'vitest'
import {
  allowedImageFileTypesLabel,
  doesImageContentMatchMimeType,
  getFileExtension,
  isAllowedCombinedSubmitPhotoSize,
  isAllowedImageExtension,
  isAllowedImageMimeType,
  isAllowedImageMimeTypeAndExtension,
  isAllowedImageSize,
  isAllowedSourceImageSize,
  isHeicImageFile,
  maxCombinedSubmitPhotoSizeInBytes,
  maxCombinedSubmitPhotoSizeLabel,
  maxImageFileSizeInBytes,
  maxImageFileSizeLabel,
  maxSourceImageFileSizeInBytes,
  maxSourceImageFileSizeLabel
} from '~~/shared/utils/imageValidation'

describe('imageValidation', () => {
  it('exposes user friendly upload labels', () => {
    expect(allowedImageFileTypesLabel).toBe(
      'JPG, PNG, WebP, HEIC, or HEIF'
    )
    expect(maxImageFileSizeLabel).toBe('8 MB')
    expect(maxSourceImageFileSizeLabel).toBe('25 MB')
    expect(maxCombinedSubmitPhotoSizeLabel).toBe('4 MB')
  })

  it('validates stored image signatures', () => {
    expect(
      doesImageContentMatchMimeType(
        'image/jpeg',
        new Uint8Array([0xff, 0xd8, 0xff, 0xe0])
      )
    ).toBe(true)
    expect(
      doesImageContentMatchMimeType(
        'image/png',
        new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      )
    ).toBe(true)
    expect(
      doesImageContentMatchMimeType(
        'image/webp',
        new Uint8Array([
          0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0,
          0x57, 0x45, 0x42, 0x50
        ])
      )
    ).toBe(true)
    expect(
      doesImageContentMatchMimeType(
        'image/heic',
        new Uint8Array([0, 0, 0, 0x18])
      )
    ).toBe(false)
  })

  it('allows only converted image MIME types for final uploads', () => {
    expect(isAllowedImageMimeType('image/jpeg')).toBe(true)
    expect(isAllowedImageMimeType('image/png')).toBe(true)
    expect(isAllowedImageMimeType('image/webp')).toBe(true)
    expect(isAllowedImageMimeType('image/heic')).toBe(false)
    expect(isAllowedImageMimeType('image/heif')).toBe(false)
  })

  it('validates final and source size limits', () => {
    expect(isAllowedImageSize(1)).toBe(true)
    expect(isAllowedImageSize(maxImageFileSizeInBytes)).toBe(true)
    expect(isAllowedImageSize(maxImageFileSizeInBytes + 1)).toBe(false)
    expect(isAllowedSourceImageSize(maxImageFileSizeInBytes + 1)).toBe(true)
    expect(isAllowedSourceImageSize(maxSourceImageFileSizeInBytes)).toBe(true)
    expect(isAllowedSourceImageSize(maxSourceImageFileSizeInBytes + 1)).toBe(false)
  })

  it('validates the combined prepared photo budget', () => {
    expect(
      isAllowedCombinedSubmitPhotoSize(
        1_500_000,
        maxCombinedSubmitPhotoSizeInBytes - 1_500_000
      )
    ).toBe(true)
    expect(isAllowedCombinedSubmitPhotoSize(0, 1_000_000)).toBe(false)
    expect(isAllowedCombinedSubmitPhotoSize(2_000_001, 2_000_000)).toBe(false)
  })

  it('normalizes and validates image extensions', () => {
    expect(getFileExtension('tag.Photo.HEIC')).toBe('heic')
    expect(getFileExtension('photo')).toBe('')
    for (const name of [
      'photo.jpg',
      'photo.jpeg',
      'photo.png',
      'photo.webp',
      'photo.heic',
      'photo.HEIF'
    ]) {
      expect(isAllowedImageExtension(name)).toBe(true)
    }
    expect(isAllowedImageExtension('photo.gif')).toBe(false)
  })

  it('recognizes HEIC and HEIF from MIME type or extension', () => {
    expect(isHeicImageFile('image/heic', 'photo.bin')).toBe(true)
    expect(isHeicImageFile('image/heif-sequence', 'photo.bin')).toBe(true)
    expect(isHeicImageFile('', 'photo.HEIC')).toBe(true)
    expect(isHeicImageFile('application/octet-stream', 'photo.heif')).toBe(true)
    expect(isHeicImageFile('image/jpeg', 'photo.jpg')).toBe(false)
  })

  it('allows matching final image type and extension pairs', () => {
    expect(isAllowedImageMimeTypeAndExtension('image/jpeg', 'photo.jpg')).toBe(true)
    expect(isAllowedImageMimeTypeAndExtension('image/jpeg', 'photo.JPEG')).toBe(true)
    expect(isAllowedImageMimeTypeAndExtension('image/png', 'photo.png')).toBe(true)
    expect(isAllowedImageMimeTypeAndExtension('image/webp', 'photo.webp')).toBe(true)
    expect(isAllowedImageMimeTypeAndExtension('image/jpeg', 'photo.png')).toBe(false)
  })

  it('allows HEIC source variants, including missing MIME metadata', () => {
    expect(isAllowedImageMimeTypeAndExtension('image/heic', 'photo.heic')).toBe(true)
    expect(isAllowedImageMimeTypeAndExtension('image/heif', 'photo.heif')).toBe(true)
    expect(
      isAllowedImageMimeTypeAndExtension('image/heic-sequence', 'photo.HEIF')
    ).toBe(true)
    expect(isAllowedImageMimeTypeAndExtension('', 'photo.HEIC')).toBe(true)
  })

  it('rejects mismatched source types and missing extensions', () => {
    expect(isAllowedImageMimeTypeAndExtension('image/heic', 'photo.jpg')).toBe(false)
    expect(isAllowedImageMimeTypeAndExtension('image/jpeg', 'photo.heic')).toBe(false)
    expect(isAllowedImageMimeTypeAndExtension('image/gif', 'photo.jpg')).toBe(false)
    expect(isAllowedImageMimeTypeAndExtension('image/jpeg', 'photo')).toBe(false)
  })
})
