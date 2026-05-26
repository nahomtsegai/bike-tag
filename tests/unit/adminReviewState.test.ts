import { describe, expect, it } from 'vitest'
import { validateSelectedSubmissionForReviewState } from '../../app/utils/adminReviewState'
import type { AdminSubmission } from '../../app/types/adminSubmissions'

const createSubmission = (
  overrides: Partial<AdminSubmission> = {}
): AdminSubmission => {
  return {
    id: 'submission-123',
    activeTagId: 'tag-456',
    riderName: 'Nahom',
    foundLocationMapUrl: 'https://maps.example.com/found',
    matchPhotoUrl: 'https://photos.example.com/match.jpg',
    nextTitle: 'Bridge Tag',
    nextClue: 'Look near the river.',
    nextHiddenLocationMapUrl: 'https://maps.example.com/hidden',
    nextTagPhotoUrl: 'https://photos.example.com/next.jpg',
    status: 'pending',
    rejectionReason: null,
    reviewedAt: null,
    reviewedBy: null,
    createdAt: '2026-05-26T12:00:00.000Z',
    updatedAt: '2026-05-26T12:00:00.000Z',
    ...overrides
  }
}

describe('adminReviewState', () => {
  describe('validateSelectedSubmissionForReviewState', () => {
    it('returns an error when no submission is selected', () => {
      expect(
        validateSelectedSubmissionForReviewState({
          selectedSubmission: null
        })
      ).toEqual({
        isValid: false,
        errorMessage: 'Select a submission first.'
      })
    })

    it('returns an error when the selected submission is approved', () => {
      expect(
        validateSelectedSubmissionForReviewState({
          selectedSubmission: createSubmission({
            status: 'approved'
          })
        })
      ).toEqual({
        isValid: false,
        errorMessage: 'Only pending submissions can be reviewed.'
      })
    })

    it('returns an error when the selected submission is rejected', () => {
      expect(
        validateSelectedSubmissionForReviewState({
          selectedSubmission: createSubmission({
            status: 'rejected'
          })
        })
      ).toEqual({
        isValid: false,
        errorMessage: 'Only pending submissions can be reviewed.'
      })
    })

    it('returns valid when the selected submission is pending', () => {
      expect(
        validateSelectedSubmissionForReviewState({
          selectedSubmission: createSubmission({
            status: 'pending'
          })
        })
      ).toEqual({
        isValid: true,
        errorMessage: ''
      })
    })
  })
})