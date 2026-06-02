export type PublicSubmissionStatus =
  | 'pending'
  | 'approved'
  | 'rejected'

export type PublicSubmissionStatusResponse = {
  id: string
  status: PublicSubmissionStatus
  submittedAt: string
  reviewedAt: string | null
  riderName: string
  nextTitle: string
  reviewNote: string | null
}