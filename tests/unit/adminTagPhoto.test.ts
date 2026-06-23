import { describe, expect, it } from 'vitest'
import {
  createAdminTagRequestBody,
  validateAdminTagPhotoFile
} from '../../app/utils/adminTagPhoto'
import { maxSourceImageFileSizeInBytes } from '../../shared/utils/imageValidation'

describe('adminTagPhoto', () => {
  it('accepts supported image files', () => {
    expect(() =>
      validateAdminTagPhotoFile({
        name: 'tag-photo.jpg',
        type: 'image/jpeg',
        size: 1024
      })
    ).not.toThrow()
  })

  it('rejects unsupported image files', () => {
    expect(() =>
      validateAdminTagPhotoFile({
        name: 'tag-photo.gif',
        type: 'image/gif',
        size: 1024
      })
    ).toThrow('Photo must be a JPG, PNG, WebP, HEIC, or HEIF image.')
  })

  it('rejects source files larger than the preparation limit', () => {
    expect(() =>
      validateAdminTagPhotoFile({
        name: 'tag-photo.jpg',
        type: 'image/jpeg',
        size: maxSourceImageFileSizeInBytes + 1
      })
    ).toThrow('Photo must be smaller than 25 MB.')
  })

  it('keeps JSON requests for URL-based photos', () => {
    expect(
      createAdminTagRequestBody({
        title: 'Tag title',
        clue: 'Tag clue',
        imageUrl: 'https://example.com/tag.jpg',
        hiddenLocationMapUrl: 'https://maps.google.com/example'
      })
    ).toEqual({
      title: 'Tag title',
      clue: 'Tag clue',
      imageUrl: 'https://example.com/tag.jpg',
      hiddenLocationMapUrl: 'https://maps.google.com/example'
    })
  })
})
