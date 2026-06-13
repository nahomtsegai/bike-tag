import type {
  AdminSubmitErrorFilter,
  AdminSubmitErrorsResponse
} from '~/types/adminSubmitErrors'

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
    query: {
      filter,
      limit,
      offset
    }
  })
}