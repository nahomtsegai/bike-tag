import {
  getReviewConfirmationButtonLabel,
  getReviewConfirmationDescription,
  getReviewConfirmationTitle,
  type ReviewActionToConfirm
} from './adminReview'

type ReviewConfirmationState = {
  title: string
  description: string
  buttonLabel: string
}

type GetReviewConfirmationStateOptions = {
  reviewActionToConfirm: ReviewActionToConfirm | null
}

export const getReviewConfirmationState = ({
  reviewActionToConfirm
}: GetReviewConfirmationStateOptions): ReviewConfirmationState => {
  if (!reviewActionToConfirm) {
    return {
      title: '',
      description: '',
      buttonLabel: ''
    }
  }

  return {
    title: getReviewConfirmationTitle(reviewActionToConfirm),
    description: getReviewConfirmationDescription(reviewActionToConfirm),
    buttonLabel: getReviewConfirmationButtonLabel(reviewActionToConfirm)
  }
}