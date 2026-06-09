import type { AdminSubmissionDetailResponse } from '~/types/adminSubmissions'
import { getAdminAuthHeaders } from './adminTokenStorage'

type GetAdminSubmissionDetailOptions = {
  submissionId: string
}

export const getAdminSubmissionDetail = ({
  submissionId
}: GetAdminSubmissionDetailOptions) => {
  return $fetch<AdminSubmissionDetailResponse>(
    `/api/admin/submissions/${submissionId}`,
    {
      headers: getAdminAuthHeaders()
    }
  )
}