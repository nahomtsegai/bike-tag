import type { AdminSubmission } from '~/types/adminSubmissions'

type ValidateSelectedSubmissionForReviewStateOptions = {
  selectedSubmission: AdminSubmission | null
}

type ValidReviewState = {
  isValid: true
  errorMessage: ''
}

type InvalidReviewState = {
  isValid: false
  errorMessage: string
}

type ReviewStateValidationResult = ValidReviewState | InvalidReviewState

export const validateSelectedSubmissionForReviewState = ({
  selectedSubmission
}: ValidateSelectedSubmissionForReviewStateOptions): ReviewStateValidationResult => {
  if (!selectedSubmission) {
    return {
      isValid: false,
      errorMessage: 'Select a submission first.'
    }
  }

  if (selectedSubmission.status !== 'pending') {
    return {
      isValid: false,
      errorMessage: 'Only pending submissions can be reviewed.'
    }
  }

  return {
    isValid: true,
    errorMessage: ''
  }
}