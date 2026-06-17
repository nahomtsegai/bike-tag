import { assertAdminRequestAccess } from '../../../utils/adminAuth'
import { fetchAdminAuditEventsFromSupabase } from '../../../utils/adminAudit'

const defaultAuditEventLimit = 50
const maxAuditEventLimit = 100
const defaultAuditEventOffset = 0

const getSingleQueryValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return value[0]
  }

  return value
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

const getAuditEventLimit = (event: Parameters<typeof getQuery>[0]) => {
  const query = getQuery(event)
  const limit = getPositiveIntegerQueryValue(
    query.limit,
    'Limit',
    defaultAuditEventLimit
  )

  if (limit < 1 || limit > maxAuditEventLimit) {
    throw createError({
      statusCode: 400,
      statusMessage: `Limit must be between 1 and ${maxAuditEventLimit}.`
    })
  }

  return limit
}

const getAuditEventOffset = (event: Parameters<typeof getQuery>[0]) => {
  const query = getQuery(event)

  return getPositiveIntegerQueryValue(
    query.offset,
    'Offset',
    defaultAuditEventOffset
  )
}

export default defineEventHandler(async (event) => {
  await assertAdminRequestAccess(event)

  const limit = getAuditEventLimit(event)
  const offset = getAuditEventOffset(event)
  const result = await fetchAdminAuditEventsFromSupabase({
    limit,
    offset
  })

  return {
    success: true,
    events: result.events,
    pagination: result.pagination
  }
})
