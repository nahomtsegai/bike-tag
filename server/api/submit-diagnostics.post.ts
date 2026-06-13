import type { H3Event } from 'h3'
import { logSubmitDiagnosticEvent } from '../utils/submitDiagnostics'
import {
  assertRateLimit,
  getClientIpAddress,
  getPositiveNumberConfig
} from '../utils/rateLimit'

type SubmitDiagnosticEventBody = {
  sessionId?: string
  eventName?: string
  step?: string
  message?: string
  metadata?: Record<string, unknown>
  userAgent?: string
  screenWidth?: number
  screenHeight?: number
}

const maxTextLength = 500
const maxEventNameLength = 80
const maxSessionIdLength = 120

const getSubmitDiagnosticRateLimitConfig = () => {
  const runtimeConfig = useRuntimeConfig()

  return {
    attempts: getPositiveNumberConfig(
      runtimeConfig.submitDiagnosticRateLimitAttempts,
      30
    ),
    windowMs: getPositiveNumberConfig(
      runtimeConfig.submitDiagnosticRateLimitWindowMs,
      10 * 60 * 1000
    )
  }
}

const assertSubmitDiagnosticRateLimit = async (event: H3Event) => {
  const rateLimitConfig = getSubmitDiagnosticRateLimitConfig()

  await assertRateLimit({
    key: `submit-diagnostics:${getClientIpAddress(event)}`,
    limit: rateLimitConfig.attempts,
    windowMs: rateLimitConfig.windowMs,
    messagePrefix: 'Too many diagnostic events.'
  })
}

const createValidationError = (message: string) => {
  return createError({
    statusCode: 400,
    statusMessage: message
  })
}

const normalizeOptionalText = (value: unknown, maxLength = maxTextLength) => {
  if (typeof value !== 'string') {
    return null
  }

  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return null
  }

  return trimmedValue.slice(0, maxLength)
}

const getRequiredText = (
  value: unknown,
  fieldName: string,
  maxLength: number
) => {
  const normalizedValue = normalizeOptionalText(value, maxLength)

  if (!normalizedValue) {
    throw createValidationError(`${fieldName} is required.`)
  }

  return normalizedValue
}

const normalizeOptionalInteger = (value: unknown) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null
  }

  return Math.round(value)
}

const normalizeMetadata = (value: unknown) => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

export default defineEventHandler(async (event: H3Event) => {
  await assertSubmitDiagnosticRateLimit(event)

  const body = await readBody<SubmitDiagnosticEventBody>(event)

  const sessionId = getRequiredText(
    body.sessionId,
    'Session ID',
    maxSessionIdLength
  )

  const eventName = getRequiredText(
    body.eventName,
    'Event name',
    maxEventNameLength
  )

  await logSubmitDiagnosticEvent({
    sessionId,
    eventName,
    step: normalizeOptionalText(body.step),
    message: normalizeOptionalText(body.message),
    metadata: normalizeMetadata(body.metadata),
    userAgent: normalizeOptionalText(body.userAgent, 300),
    screenWidth: normalizeOptionalInteger(body.screenWidth),
    screenHeight: normalizeOptionalInteger(body.screenHeight)
  })

  return {
    success: true
  }
})