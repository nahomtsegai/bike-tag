import { describe, expect, it } from 'vitest'
import { getReviewConfirmationState } from '../../app/utils/adminReviewConfirmationState'

describe('adminReviewConfirmationState', () => {
  describe('getReviewConfirmationState', () => {
    it('returns empty modal copy when no review action is selected', () => {
      expect(
        getReviewConfirmationState({
          reviewActionToConfirm: null
        })
      ).toEqual({
        title: '',
        description: '',
        buttonLabel: ''
      })
    })

    it('returns approve modal copy for approve review actions', () => {
      expect(
        getReviewConfirmationState({
          reviewActionToConfirm: 'approve'
        })
      ).toEqual({
        title: 'Approve submission?',
        description:
          'This will update the current active tag and mark this submission as approved.',
        buttonLabel: 'Approve submission'
      })
    })

    it('returns reject modal copy for reject review actions', () => {
      expect(
        getReviewConfirmationState({
          reviewActionToConfirm: 'reject'
        })
      ).toEqual({
        title: 'Reject submission?',
        description:
          'This will mark this submission as rejected. The current active tag will not change.',
        buttonLabel: 'Reject submission'
      })
    })
  })
})