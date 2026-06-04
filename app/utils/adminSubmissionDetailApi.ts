import type { AdminSubmissionDetailResponse } from '~/types/adminSubmissions'

type GetAdminSubmissionDetailOptions = {
  submissionId: string
}

export const getAdminSubmissionDetail = ({
  submissionId
}: GetAdminSubmissionDetailOptions) => {
  return $fetch<AdminSubmissionDetailResponse>(
    `/api/admin/submissions/${submissionId}`
  )
}