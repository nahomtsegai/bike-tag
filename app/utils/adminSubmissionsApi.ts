import type { AdminSubmissionsResponse } from '~/types/adminSubmissions'

type GetAdminSubmissionsOptions = {
  queryParams: string
}

export const getAdminSubmissions = ({
  queryParams
}: GetAdminSubmissionsOptions) => {
  return $fetch<AdminSubmissionsResponse>(
    `/api/admin/submissions?${queryParams}`
  )
}