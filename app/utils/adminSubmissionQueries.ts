import type { AdminSubmissionStatus } from './adminSubmissions'

export type AdminSubmissionQueryFilters = {
  selectedStatus: AdminSubmissionStatus | ''
  searchQuery: string
  limit: number
  offset: number
}

export const buildAdminSubmissionsQueryParams = ({
  selectedStatus,
  searchQuery,
  limit,
  offset
}: AdminSubmissionQueryFilters) => {
  const queryParams = new URLSearchParams()

  queryParams.set('limit', String(limit))
  queryParams.set('offset', String(offset))

  if (selectedStatus) {
    queryParams.set('status', selectedStatus)
  }

  const trimmedSearch = searchQuery.trim()

  if (trimmedSearch) {
    queryParams.set('search', trimmedSearch)
  }

  return queryParams.toString()
}