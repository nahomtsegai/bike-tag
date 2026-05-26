import type { ReviewActionToConfirm } from '~/utils/adminReview'

type GetReviewModalTriggerElementOptions = {
  reviewAction: ReviewActionToConfirm
  approveButtonElement: HTMLElement | null
  rejectButtonElement: HTMLElement | null
}

export const getReviewModalTriggerElement = ({
  reviewAction,
  approveButtonElement,
  rejectButtonElement
}: GetReviewModalTriggerElementOptions) => {
  if (reviewAction === 'approve') {
    return approveButtonElement
  }

  return rejectButtonElement
}