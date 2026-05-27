import { describe, expect, it } from 'vitest'
import {
  getFirstSubmitTagErrorField,
  getSubmitTagValidationSummary
} from '../../app/utils/submitTagValidation'

describe('submitTagValidation', () => {
  describe('getFirstSubmitTagErrorField', () => {
    it('returns null when there are no validation errors', () => {
      expect(getFirstSubmitTagErrorField({})).toBeNull()
    })

    it('returns the first error field based on form order', () => {
      expect(
        getFirstSubmitTagErrorField({
          nextPhoto: 'Add a photo for the next tag.',
          riderName: 'Enter your name.',
          nextTitle: 'Enter a title for the next tag.'
        })
      ).toBe('riderName')
    })

    it('returns the next available error when earlier fields are valid', () => {
      expect(
        getFirstSubmitTagErrorField({
          nextHiddenLocationMapUrl: 'Paste a Google Maps link.',
          nextPhoto: 'Add a photo for the next tag.'
        })
      ).toBe('nextHiddenLocationMapUrl')
    })
  })

  describe('getSubmitTagValidationSummary', () => {
    it('returns an empty message when there are no validation errors', () => {
      expect(getSubmitTagValidationSummary({})).toBe('')
    })

    it('returns a singular summary for one validation error', () => {
      expect(
        getSubmitTagValidationSummary({
          riderName: 'Enter your name.'
        })
      ).toBe('Please fix 1 field before reviewing your submission.')
    })

    it('returns a plural summary for multiple validation errors', () => {
      expect(
        getSubmitTagValidationSummary({
          riderName: 'Enter your name.',
          nextPhoto: 'Add a photo for the next tag.'
        })
      ).toBe('Please fix 2 fields before reviewing your submission.')
    })
  })
})