import type {
  ApproveSubmissionResponse,
  RejectSubmissionResponse
} from '~/types/adminSubmissions'
import { getAdminAuthHeaders } from './adminTokenStorage'

type AdminReviewRequestOptions = {
  submissionId: string
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
  reviewedBy
}: ApproveAdminSubmissionOptions) => {
  return $fetch<ApproveSubmissionResponse>(
    `/api/admin/submissions/${submissionId}/approve`,
    {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      body: {
        reviewedBy
      }
    }
  )
}

export const rejectAdminSubmission = ({
  submissionId,
  reviewedBy,
  rejectionReason
}: RejectAdminSubmissionOptions) => {
  return $fetch<RejectSubmissionResponse>(
    `/api/admin/submissions/${submissionId}/reject`,
    {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      body: {
        reviewedBy,
        rejectionReason
      }
    }
  )
}