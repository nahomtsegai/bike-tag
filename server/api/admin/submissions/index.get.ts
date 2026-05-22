import { assertAdminAccess } from '../../../utils/adminAuth'
import {
  fetchAdminSubmissionsFromSupabase,
  isAdminSubmissionStatus
} from '../../../utils/supabaseAdminSubmissions'

const defaultSubmissionLimit = 50
const maxSubmissionLimit = 100
const defaultSubmissionOffset = 0
const maxSearchLength = 100

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

export default defineEventHandler(async (event) => {
  assertAdminAccess(event)

  const status = getSubmissionStatusFilter(event)
  const search = getSearchQuery(event)
  const limit = getSubmissionLimit(event)
  const offset = getSubmissionOffset(event)

  const result = await fetchAdminSubmissionsFromSupabase({
    status,
    search,
    limit,
    offset
  })

  return {
    success: true,
    submissions: result.submissions,
    pagination: result.pagination
  }
})