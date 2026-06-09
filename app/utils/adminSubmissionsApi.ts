import type { AdminSubmissionsResponse } from '~/types/adminSubmissions'
import { getAdminAuthHeaders } from './adminTokenStorage'

type GetAdminSubmissionsOptions = {
  queryParams: string
}

export const getAdminSubmissions = ({
  queryParams
}: GetAdminSubmissionsOptions) => {
  return $fetch<AdminSubmissionsResponse>(
    `/api/admin/submissions?${queryParams}`,
    {
      headers: getAdminAuthHeaders()
    }
  )
}