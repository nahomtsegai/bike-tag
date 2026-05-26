export type ReviewerValidationError = {
  statusCode: 400
  statusMessage: string
}

export const getValidatedReviewerName = (reviewerName: string) => {
  const trimmedReviewerName = reviewerName.trim()

  if (!trimmedReviewerName) {
    throw {
      statusCode: 400,
      statusMessage: 'Reviewer name is required.'
    } satisfies ReviewerValidationError
  }

  return trimmedReviewerName
}