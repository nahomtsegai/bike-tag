import { assertAdminRequestAccess } from '../../../utils/adminAuth'
import {
  fetchAdminSubmissionsFromSupabase,
  isAdminSubmissionStatus
} from '../../../utils/supabaseAdminSubmissions'

const defaultSubmissionLimit = 50
const maxSubmissionLimit = 100
const defaultSubmissionOffset = 0
const maxSearchLength = 100
const adminSubmissionStatuses = [
  'pending',
  'approved',
  'rejected',
  'superseded'
] as const

const getSingleQueryValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

const getSubmissionStatusFilter = (
  event: Parameters<typeof getQuery>[0]
) => {
  const query = getQuery(event)
  const status = getSingleQueryValue(query.status)

  if (status === undefined || status === null || status === '') {
    return undefined
  }

  if (!isAdminSubmissionStatus(status)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Submission status filter is invalid.'
    })
  }

  return status
}

const getIncludeArchivedFilter = (
  event: Parameters<typeof getQuery>[0]
) => {
  const query = getQuery(event)
  const includeArchived = getSingleQueryValue(query.includeArchived)

  if (
    includeArchived === undefined ||
    includeArchived === null ||
    includeArchived === ''
  ) {
    return false
  }

  if (includeArchived === 'true') {
    return true
  }

  if (includeArchived === 'false') {
    return false
  }

  throw createError({
    statusCode: 400,
    statusMessage: 'Include archived filter is invalid.'
  })
}

const getSearchQuery = (event: Parameters<typeof getQuery>[0]) => {
  const query = getQuery(event)
  const search = getSingleQueryValue(query.search)

  if (search === undefined || search === null || search === '') {
    return undefined
  }

  if (typeof search !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Search query is invalid.'
    })
  }

  const trimmedSearch = search.trim()

  if (!trimmedSearch) {
    return undefined
  }

  if (trimmedSearch.length > maxSearchLength) {
    throw createError({
      statusCode: 400,
      statusMessage: `Search query must be ${maxSearchLength} characters or fewer.`
    })
  }

  return trimmedSearch
}

const getPositiveIntegerQueryValue = (
  value: unknown,
  fieldName: string,
  defaultValue: number
) => {
  const singleValue = getSingleQueryValue(value)

  if (singleValue === undefined || singleValue === null || singleValue === '') {
    return defaultValue
  }

  const numericValue = Number(singleValue)

  if (!Number.isInteger(numericValue) || numericValue < 0) {
    throw createError({
      statusCode: 400,
      statusMessage: `${fieldName} must be a positive integer.`
    })
  }

  return numericValue
}

const getSubmissionLimit = (event: Parameters<typeof getQuery>[0]) => {
  const query = getQuery(event)
  const limit = getPositiveIntegerQueryValue(
    query.limit,
    'Limit',
    defaultSubmissionLimit
  )

  if (limit < 1 || limit > maxSubmissionLimit) {
    throw createError({
      statusCode: 400,
      statusMessage: `Limit must be between 1 and ${maxSubmissionLimit}.`
    })
  }

  return limit
}

const getSubmissionOffset = (event: Parameters<typeof getQuery>[0]) => {
  const query = getQuery(event)

  return getPositiveIntegerQueryValue(
    query.offset,
    'Offset',
    defaultSubmissionOffset
  )
}

const fetchSubmissionSummary = async (
  search: string | undefined,
  includeArchived: boolean
) => {
  const summaryResults = await Promise.all(
    adminSubmissionStatuses.map(async (status) => {
      const result = await fetchAdminSubmissionsFromSupabase({
        status,
        search,
        limit: 1,
        offset: 0,
        includeArchived
      })

      return [status, result.pagination.count] as const
    })
  )

  return {
    pending: summaryResults.find(([status]) => {
      return status === 'pending'
    })?.[1] || 0,
    approved: summaryResults.find(([status]) => {
      return status === 'approved'
    })?.[1] || 0,
    rejected: summaryResults.find(([status]) => {
      return status === 'rejected'
    })?.[1] || 0,
    superseded: summaryResults.find(([status]) => {
      return status === 'superseded'
    })?.[1] || 0
  }
}

export default defineEventHandler(async (event) => {
  await assertAdminRequestAccess(event)

  const status = getSubmissionStatusFilter(event)
  const includeArchived = getIncludeArchivedFilter(event)
  const search = getSearchQuery(event)
  const limit = getSubmissionLimit(event)
  const offset = getSubmissionOffset(event)

  const [result, summary] = await Promise.all([
    fetchAdminSubmissionsFromSupabase({
      status,
      search,
      limit,
      offset,
      includeArchived
    }),
    fetchSubmissionSummary(search, includeArchived)
  ])

  return {
    success: true,
    submissions: result.submissions,
    summary,
    pagination: result.pagination
  }
})
