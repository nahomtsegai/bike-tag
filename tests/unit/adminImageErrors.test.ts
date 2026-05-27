import { describe, expect, it } from 'vitest'
import {
  addAdminImageError,
  hasAdminImageError
} from '../../app/utils/adminImageErrors'
import { getImageErrorKey } from '../../app/utils/adminSubmissions'

describe('adminImageErrors', () => {
  describe('hasAdminImageError', () => {
    it('returns false when the image error key does not exist', () => {
      expect(
        hasAdminImageError({
          failedImageKeys: new Set(),
          submissionId: 'submission-123',
          imageType: 'matchPhoto'
        })
      ).toBe(false)
    })

    it('returns true when the image error key exists', () => {
      expect(
        hasAdminImageError({
          failedImageKeys: new Set([
            getImageErrorKey('submission-123', 'matchPhoto')
          ]),
          submissionId: 'submission-123',
          imageType: 'matchPhoto'
        })
      ).toBe(true)
    })
  })

  describe('addAdminImageError', () => {
    it('adds an image error key without mutating the original set', () => {
      const existingImageErrorKey = getImageErrorKey(
        'submission-456',
        'nextTagPhoto'
      )
      const newImageErrorKey = getImageErrorKey(
        'submission-123',
        'matchPhoto'
      )
      const failedImageKeys = new Set([existingImageErrorKey])

      const updatedFailedImageKeys = addAdminImageError({
        failedImageKeys,
        submissionId: 'submission-123',
        imageType: 'matchPhoto'
      })

      expect(updatedFailedImageKeys).toEqual(
        new Set([
          existingImageErrorKey,
          newImageErrorKey
        ])
      )

      expect(failedImageKeys).toEqual(new Set([existingImageErrorKey]))
    })
  })
})