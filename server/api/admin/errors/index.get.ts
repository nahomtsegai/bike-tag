import { assertAdminRequestAccess } from '../../../utils/adminAuth'
import {
  fetchAdminSubmitErrorsFromSupabase,
  isAdminSubmitErrorFilter
} from '../../../utils/supabaseAdminSubmitErrors'

const defaultSubmitErrorLimit = 50
const maxSubmitErrorLimit = 100
const defaultSubmitErrorOffset = 0

const getSingleQueryValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

const getSubmitErrorFilter = (
  event: Parameters<typeof getQuery>[0]
) => {
  const query = getQuery(event)
  const filter = getSingleQueryValue(query.filter)

  if (filter === undefined || filter === null || filter === '') {
    return 'all'
  }

  if (!isAdminSubmitErrorFilter(filter)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Submit error filter is invalid.'
    })
  }

  return filter
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

const getSubmitErrorLimit = (event: Parameters<typeof getQuery>[0]) => {
  const query = getQuery(event)
  const limit = getPositiveIntegerQueryValue(
    query.limit,
    'Limit',
    defaultSubmitErrorLimit
  )

  if (limit < 1 || limit > maxSubmitErrorLimit) {
    throw createError({
      statusCode: 400,
      statusMessage: `Limit must be between 1 and ${maxSubmitErrorLimit}.`
    })
  }

  return limit
}

const getSubmitErrorOffset = (event: Parameters<typeof getQuery>[0]) => {
  const query = getQuery(event)

  return getPositiveIntegerQueryValue(
    query.offset,
    'Offset',
    defaultSubmitErrorOffset
  )
}

export default defineEventHandler(async (event) => {
  await assertAdminRequestAccess(event)

  const filter = getSubmitErrorFilter(event)
  const limit = getSubmitErrorLimit(event)
  const offset = getSubmitErrorOffset(event)

  const result = await fetchAdminSubmitErrorsFromSupabase({
    filter,
    limit,
    offset
  })

  return {
    success: true,
    events: result.events,
    pagination: result.pagination
  }
})