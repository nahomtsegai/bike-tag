import type { H3Event } from 'h3'
import {
  safelyReportRuntimeError,
  type RuntimeErrorSource
} from '../utils/runtimeErrorMonitoring'
import { ensureEventRequestId } from '../utils/requestId'
import {
  assertRateLimit,
  getClientIpAddress,
  getPositiveNumberConfig
} from '../utils/rateLimit'

type RuntimeErrorRequestBody = {
  source?: RuntimeErrorSource
  name?: string
  message?: string
  stack?: string | null
  routePath?: string | null
  statusCode?: number | null
  requestId?: string | null
  screenWidth?: number | null
  screenHeight?: number | null
}

const allowedSources = new Set<RuntimeErrorSource>([
  'client-vue',
  'client-app',
  'client-window',
  'client-promise'
])
const maxNameLength = 120
const maxMessageLength = 1_000
const maxStackLength = 8_000
const maxPathLength = 300
const maxRequestIdLength = 120

const normalizeOptionalText = (value: unknown, maxLength: number) => {
  if (typeof value !== 'string') {
    return null
  }

  const normalizedValue = value.trim()

  return normalizedValue ? normalizedValue.slice(0, maxLength) : null
}

const getRequiredText = (
  value: unknown,
  fieldName: string,
  maxLength: number
) => {
  const normalizedValue = normalizeOptionalText(value, maxLength)

  if (!normalizedValue) {
    throw createError({
      statusCode: 400,
      statusMessage: `${fieldName} is required.`
    })
  }

  return normalizedValue
}

const normalizeOptionalNumber = (value: unknown) => {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.round(value)
    : null
}

const getRuntimeErrorRateLimitConfig = () => {
  const runtimeConfig = useRuntimeConfig()

  return {
    attempts: getPositiveNumberConfig(
      runtimeConfig.runtimeErrorRateLimitAttempts,
      20
    ),
    windowMs: getPositiveNumberConfig(
      runtimeConfig.runtimeErrorRateLimitWindowMs,
      10 * 60 * 1_000
    )
  }
}

const assertRuntimeErrorRateLimit = async (event: H3Event) => {
  const config = getRuntimeErrorRateLimitConfig()

  await assertRateLimit({
    key: `runtime-errors:${getClientIpAddress(event)}`,
    limit: config.attempts,
    windowMs: config.windowMs,
    messagePrefix: 'Too many runtime error reports.'
  })
}

const getRuntimeErrorSource = (value: unknown) => {
  if (typeof value !== 'string' || !allowedSources.has(value as RuntimeErrorSource)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Runtime error source is invalid.'
    })
  }

  return value as RuntimeErrorSource
}

export default defineEventHandler(async (event) => {
  await assertRuntimeErrorRateLimit(event)

  const body = await readBody<RuntimeErrorRequestBody>(event)
  const serverRequestId = ensureEventRequestId(event)
  const result = await safelyReportRuntimeError({
    source: getRuntimeErrorSource(body.source),
    name: getRequiredText(body.name, 'Error name', maxNameLength),
    message: getRequiredText(body.message, 'Error message', maxMessageLength),
    stack: normalizeOptionalText(body.stack, maxStackLength),
    routePath: normalizeOptionalText(body.routePath, maxPathLength),
    method: 'CLIENT',
    statusCode: normalizeOptionalNumber(body.statusCode),
    requestId:
      normalizeOptionalText(body.requestId, maxRequestIdLength) ||
      serverRequestId,
    userAgent: getHeader(event, 'user-agent') || null,
    screenWidth: normalizeOptionalNumber(body.screenWidth),
    screenHeight: normalizeOptionalNumber(body.screenHeight)
  })

  return {
    success: true,
    reported: result.reported,
    eventId: result.eventId,
    requestId: serverRequestId
  }
})
