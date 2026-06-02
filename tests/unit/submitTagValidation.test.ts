import { describe, expect, it } from 'vitest'
import {
  getFirstSubmitTagErrorField,
  getSubmitTagValidationSummary,
  submitTagErrorFieldOrder,
  type SubmitTagFormErrors
} from '../../app/utils/submitTagValidation'

describe('submitTagValidation', () => {
  describe('submitTagErrorFieldOrder', () => {
    it('keeps fields in form order', () => {
      expect(submitTagErrorFieldOrder).toEqual([
        'riderName',
        'foundLocation',
        'matchPhoto',
        'nextTitle',
        'nextClue',
        'nextHiddenLocationMapUrl',
        'nextPhoto'
      ])
    })
  })

  describe('getFirstSubmitTagErrorField', () => {
    it('returns null when there are no errors', () => {
      expect(getFirstSubmitTagErrorField({})).toBeNull()
    })

    it('returns the first field with an error based on form order', () => {
      const errors: SubmitTagFormErrors = {
        nextPhoto: 'Add a photo for the next tag.',
        riderName: 'Enter your name.',
        nextHiddenLocationMapUrl: 'Add the hidden map link.'
      }

      expect(getFirstSubmitTagErrorField(errors)).toBe('riderName')
    })

    it('returns the hidden map link field before the next photo field', () => {
      const errors: SubmitTagFormErrors = {
        nextPhoto: 'Add a photo for the next tag.',
        nextHiddenLocationMapUrl: 'Add the hidden map link.'
      }

      expect(getFirstSubmitTagErrorField(errors)).toBe(
        'nextHiddenLocationMapUrl'
      )
    })
  })

  describe('getSubmitTagValidationSummary', () => {
    it('returns an empty string when there are no errors', () => {
      expect(getSubmitTagValidationSummary({})).toBe('')
    })

    it('returns singular summary for one error', () => {
      expect(
        getSubmitTagValidationSummary({
          riderName: 'Enter your name.'
        })
      ).toBe('Please fix 1 field before reviewing your submission.')
    })

    it('returns plural summary for multiple errors', () => {
      expect(
        getSubmitTagValidationSummary({
          riderName: 'Enter your name.',
          foundLocation: 'Capture your current location.',
          nextHiddenLocationMapUrl: 'Add the hidden map link.'
        })
      ).toBe('Please fix 3 fields before reviewing your submission.')
    })
  })
})