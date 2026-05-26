import type {
  ApproveSubmissionResponse,
  RejectSubmissionResponse
} from '~/types/adminSubmissions'

type AdminReviewRequestOptions = {
  submissionId: string
  headers: Record<string, string>
}

type ApproveAdminSubmissionOptions = AdminReviewRequestOptions & {
  reviewedBy: string
}

type RejectAdminSubmissionOptions = AdminReviewRequestOptions & {
  reviewedBy: string
  rejectionReason?: string
}

export const approveAdminSubmission = ({
  submissionId,
  headers,
  reviewedBy
}: ApproveAdminSubmissionOptions) => {
  return $fetch<ApproveSubmissionResponse>(
    `/api/admin/submissions/${submissionId}/approve`,
    {
      method: 'POST',
      headers,
      body: {
        reviewedBy
      }
    }
  )
}

export const rejectAdminSubmission = ({
  submissionId,
  headers,
  reviewedBy,
  rejectionReason
}: RejectAdminSubmissionOptions) => {
  return $fetch<RejectSubmissionResponse>(
    `/api/admin/submissions/${submissionId}/reject`,
    {
      method: 'POST',
      headers,
      body: {
        reviewedBy,
        rejectionReason
      }
    }
  )
}