import type {
  AdminSubmitErrorFilter,
  AdminSubmitErrorsResponse
} from '~/types/adminSubmitErrors'
import { getAdminAuthHeaders } from '~/utils/adminTokenStorage'

type GetAdminSubmitErrorsOptions = {
  filter: AdminSubmitErrorFilter
  limit: number
  offset: number
}

export const getAdminSubmitErrors = ({
  filter,
  limit,
  offset
}: GetAdminSubmitErrorsOptions) => {
  return $fetch<AdminSubmitErrorsResponse>('/api/admin/errors', {
    headers: getAdminAuthHeaders(),
    query: {
      filter,
      limit,
      offset
    }
  })
}