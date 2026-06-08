import type { H3Event } from 'h3'
import { createSupabaseServerClient } from '../utils/supabase'

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

const logSubmitDiagnosticEvent = async ({
  sessionId,
  eventName,
  step,
  message,
  metadata,
  userAgent,
  screenWidth,
  screenHeight
}: {
  sessionId: string
  eventName: string
  step: string | null
  message: string | null
  metadata: Record<string, unknown>
  userAgent: string | null
  screenWidth: number | null
  screenHeight: number | null
}) => {
  const supabase = createSupabaseServerClient()

  const { error } = await supabase
    .from('submit_diagnostic_events')
    .insert({
      session_id: sessionId,
      event_name: eventName,
      step,
      message,
      metadata,
      user_agent: userAgent,
      screen_width: screenWidth,
      screen_height: screenHeight
    })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Could not save submit diagnostic event: ${error.message}`
    })
  }
}

export default defineEventHandler(async (event: H3Event) => {
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