import type { AdminSubmissionDetailResponse } from '~/types/adminSubmissions'

export const getAdminSubmissionDetail = ({
  submissionId
}: {
  submissionId: string
}) => {
  return $fetch<AdminSubmissionDetailResponse>(
    `/api/admin/submissions/${submissionId}`
  )
}