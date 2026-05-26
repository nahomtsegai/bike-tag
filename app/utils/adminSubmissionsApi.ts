import type { AdminSubmissionsResponse } from '~/types/adminSubmissions'

type GetAdminSubmissionsOptions = {
  queryParams: string
  headers: Record<string, string>
}

export const getAdminSubmissions = ({
  queryParams,
  headers
}: GetAdminSubmissionsOptions) => {
  return $fetch<AdminSubmissionsResponse>(
    `/api/admin/submissions?${queryParams}`,
    {
      headers
    }
  )
}