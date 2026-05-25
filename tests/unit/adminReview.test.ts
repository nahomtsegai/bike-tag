import { describe, expect, it } from 'vitest'
import {
  getReviewConfirmationButtonLabel,
  getReviewConfirmationDescription,
  getReviewConfirmationTitle
} from '../../app/utils/adminReview'

describe('adminReview', () => {
  describe('getReviewConfirmationTitle', () => {
    it('returns the approve confirmation title', () => {
      expect(getReviewConfirmationTitle('approve')).toBe('Approve submission?')
    })

    it('returns the reject confirmation title', () => {
      expect(getReviewConfirmationTitle('reject')).toBe('Reject submission?')
    })
  })

  describe('getReviewConfirmationDescription', () => {
    it('returns the approve confirmation description', () => {
      expect(getReviewConfirmationDescription('approve')).toBe(
        'This will update the current active tag and mark this submission as approved.'
      )
    })

    it('returns the reject confirmation description', () => {
      expect(getReviewConfirmationDescription('reject')).toBe(
        'This will mark this submission as rejected. The current active tag will not change.'
      )
    })
  })

  describe('getReviewConfirmationButtonLabel', () => {
    it('returns the approve confirmation button label', () => {
      expect(getReviewConfirmationButtonLabel('approve')).toBe(
        'Approve submission'
      )
    })

    it('returns the reject confirmation button label', () => {
      expect(getReviewConfirmationButtonLabel('reject')).toBe(
        'Reject submission'
      )
    })
  })
})