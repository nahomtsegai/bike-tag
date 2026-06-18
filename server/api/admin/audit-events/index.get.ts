import { assertAdminRequestAccess } from '../../../utils/adminAuth'
import type {
  AdminAuditAction,
  AdminAuditOutcome
} from '../../../utils/adminAudit'
import { fetchAdminAuditHistoryFromSupabase } from '../../../utils/adminAuditHistory'

const defaultAuditEventLimit = 50
const maxAuditEventLimit = 100
const defaultAuditEventOffset = 0
const maxAuditSearchLength = 100

const allowedActions = new Set<AdminAuditAction>([
  'admin.login',
  'submission.approve',
  'submission.reject',
  'submission.archive',
  'submission.delete',
  'tag.opening.create',
  'game_data.delete'
])

const allowedOutcomes = new Set<AdminAuditOutcome>([
  'started',
  'succeeded',
  'failed'
])

const getSingleQueryValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

const getNonNegativeIntegerQueryValue = (
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
      statusMessage: `${fieldName} must be a non-negative integer.`
    })
  }

  return numericValue
}

const getAuditEventLimit = (value: unknown) => {
  const limit = getNonNegativeIntegerQueryValue(
    value,
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

const getAuditEventOffset = (value: unknown) => {
  return getNonNegativeIntegerQueryValue(
    value,
    'Offset',
    defaultAuditEventOffset
  )
}

const getAuditAction = (value: unknown) => {
  const singleValue = getSingleQueryValue(value)

  if (singleValue === undefined || singleValue === null || singleValue === '') {
    return undefined
  }

  if (typeof singleValue !== 'string' || !allowedActions.has(singleValue as AdminAuditAction)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Action filter is invalid.'
    })
  }

  return singleValue as AdminAuditAction
}

const getAuditOutcome = (value: unknown) => {
  const singleValue = getSingleQueryValue(value)

  if (singleValue === undefined || singleValue === null || singleValue === '') {
    return undefined
  }

  if (
    typeof singleValue !== 'string' ||
    !allowedOutcomes.has(singleValue as AdminAuditOutcome)
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Outcome filter is invalid.'
    })
  }

  return singleValue as AdminAuditOutcome
}

const getAuditSearch = (value: unknown) => {
  const singleValue = getSingleQueryValue(value)

  if (singleValue === undefined || singleValue === null || singleValue === '') {
    return undefined
  }

  if (typeof singleValue !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Search must be text.'
    })
  }

  const search = singleValue.trim()

  if (!search) {
    return undefined
  }

  if (search.length > maxAuditSearchLength) {
    throw createError({
      statusCode: 400,
      statusMessage: `Search must be ${maxAuditSearchLength} characters or fewer.`
    })
  }

  if (!/^[a-zA-Z0-9@._:+-]+$/.test(search)) {
    throw createError({
      statusCode: 400,
      statusMessage:
        'Search may only contain letters, numbers, and common email or ID characters.'
    })
  }

  return search
}

export default defineEventHandler(async (event) => {
  await assertAdminRequestAccess(event)

  const query = getQuery(event)
  const result = await fetchAdminAuditHistoryFromSupabase({
    action: getAuditAction(query.action),
    outcome: getAuditOutcome(query.outcome),
    search: getAuditSearch(query.search),
    limit: getAuditEventLimit(query.limit),
    offset: getAuditEventOffset(query.offset)
  })

  return {
    success: true,
    events: result.events,
    pagination: result.pagination
  }
})
