import { describe, expect, it } from 'vitest'
import { getReviewModalTriggerElement } from '../../app/utils/adminReviewActions'

const createFakeElement = () => {
  return {} as HTMLElement
}

describe('adminReviewActions', () => {
  describe('getReviewModalTriggerElement', () => {
    it('returns the approve button element for approve review actions', () => {
      const approveButtonElement = createFakeElement()
      const rejectButtonElement = createFakeElement()

      expect(
        getReviewModalTriggerElement({
          reviewAction: 'approve',
          approveButtonElement,
          rejectButtonElement
        })
      ).toBe(approveButtonElement)
    })

    it('returns the reject button element for reject review actions', () => {
      const approveButtonElement = createFakeElement()
      const rejectButtonElement = createFakeElement()

      expect(
        getReviewModalTriggerElement({
          reviewAction: 'reject',
          approveButtonElement,
          rejectButtonElement
        })
      ).toBe(rejectButtonElement)
    })

    it('returns null when the matching approve button element is unavailable', () => {
      const rejectButtonElement = createFakeElement()

      expect(
        getReviewModalTriggerElement({
          reviewAction: 'approve',
          approveButtonElement: null,
          rejectButtonElement
        })
      ).toBeNull()
    })

    it('returns null when the matching reject button element is unavailable', () => {
      const approveButtonElement = createFakeElement()

      expect(
        getReviewModalTriggerElement({
          reviewAction: 'reject',
          approveButtonElement,
          rejectButtonElement: null
        })
      ).toBeNull()
    })
  })
})