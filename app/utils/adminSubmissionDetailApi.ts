import type { AdminSubmissionDetailResponse } from '~/types/adminSubmissions'

type GetAdminSubmissionDetailOptions = {
  submissionId: string
  headers: Record<string, string>
}

export const getAdminSubmissionDetail = ({
  submissionId,
  headers
}: GetAdminSubmissionDetailOptions) => {
  return $fetch<AdminSubmissionDetailResponse>(
    `/api/admin/submissions/${submissionId}`,
    {
      headers
    }
  )
}