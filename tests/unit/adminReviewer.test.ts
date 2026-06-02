import { describe, expect, it } from 'vitest'
import { getValidatedReviewerName } from '../../app/utils/adminReviewer'

describe('adminReviewer', () => {
  describe('getValidatedReviewerName', () => {
    it('returns the trimmed reviewer name when provided', () => {
      expect(getValidatedReviewerName('  Rider  ')).toBe('Rider')
    })

    it('throws a validation error when reviewer name is empty', () => {
      expect(() => {
        getValidatedReviewerName('')
      }).toThrow()
    })

    it('throws a validation error when reviewer name only contains spaces', () => {
      try {
        getValidatedReviewerName('   ')
      } catch (error) {
        expect(error).toEqual({
          statusCode: 400,
          statusMessage: 'Reviewer name is required.'
        })
      }
    })
  })
})