export type ReviewActionToConfirm = 'approve' | 'reject'

export const getReviewConfirmationTitle = (
  reviewAction: ReviewActionToConfirm
) => {
  if (reviewAction === 'approve') {
    return 'Approve submission?'
  }

  return 'Reject submission?'
}

export const getReviewConfirmationDescription = (
  reviewAction: ReviewActionToConfirm
) => {
  if (reviewAction === 'approve') {
    return 'This will update the current active tag and mark this submission as approved.'
  }

  return 'This will mark this submission as rejected. The current active tag will not change.'
}

export const getReviewConfirmationButtonLabel = (
  reviewAction: ReviewActionToConfirm
) => {
  if (reviewAction === 'approve') {
    return 'Approve submission'
  }

  return 'Reject submission'
}