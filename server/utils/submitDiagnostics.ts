import { createSupabaseServerClient } from './supabase'

export type SubmitDiagnosticMetadata = Record<string, unknown>

type SanitizedSubmitDiagnosticMetadataValue =
  | string
  | number
  | boolean
  | null
  | SanitizedSubmitDiagnosticMetadataValue[]
  | { [key: string]: SanitizedSubmitDiagnosticMetadataValue }

type SanitizedSubmitDiagnosticMetadata = Record<
  string,
  SanitizedSubmitDiagnosticMetadataValue
>

const maxMetadataSerializedLength = 4000
const maxMetadataDepth = 3
const maxMetadataEntries = 50
const maxMetadataArrayLength = 20
const maxMetadataKeyLength = 80
const maxMetadataTextLength = 300

const metadataTruncatedKey = '_truncated'
const metadataOriginalSizeKey = '_originalSize'

const getSerializedMetadataLength = (
  metadata: SanitizedSubmitDiagnosticMetadata
) => JSON.stringify(metadata).length

const sanitizeMetadataKey = (key: string) => key.slice(0, maxMetadataKeyLength)

const sanitizeMetadataString = (value: string) =>
  value.slice(0, maxMetadataTextLength)

const sanitizeMetadataValue = (
  value: unknown,
  depth = 0
): SanitizedSubmitDiagnosticMetadataValue | undefined => {
  if (value === null) {
    return null
  }

  if (typeof value === 'string') {
    return sanitizeMetadataString(value)
  }

  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (Array.isArray(value)) {
    if (depth >= maxMetadataDepth) {
      return '[Truncated nested metadata]'
    }

    return value
      .slice(0, maxMetadataArrayLength)
      .map((item) => sanitizeMetadataValue(item, depth + 1))
      .filter((item): item is SanitizedSubmitDiagnosticMetadataValue =>
        item !== undefined
      )
  }

  if (typeof value === 'object' && value !== null) {
    if (depth >= maxMetadataDepth) {
      return '[Truncated nested metadata]'
    }

    return Object.entries(value)
      .slice(0, maxMetadataEntries)
      .reduce<Record<string, SanitizedSubmitDiagnosticMetadataValue>>(
        (sanitizedObject, [key, item]) => {
          const sanitizedValue = sanitizeMetadataValue(item, depth + 1)

          if (sanitizedValue !== undefined) {
            sanitizedObject[sanitizeMetadataKey(key)] = sanitizedValue
          }

          return sanitizedObject
        },
        {}
      )
  }

  return undefined
}

const createSizeCappedMetadata = (
  metadata: SanitizedSubmitDiagnosticMetadata
): SanitizedSubmitDiagnosticMetadata => {
  const serializedLength = getSerializedMetadataLength(metadata)

  if (serializedLength <= maxMetadataSerializedLength) {
    return metadata
  }

  const cappedMetadata: SanitizedSubmitDiagnosticMetadata = {
    [metadataTruncatedKey]: true,
    [metadataOriginalSizeKey]: serializedLength
  }

  for (const [key, value] of Object.entries(metadata)) {
    const nextMetadata = {
      ...cappedMetadata,
      [key]: value
    }

    if (
      getSerializedMetadataLength(nextMetadata) <= maxMetadataSerializedLength
    ) {
      cappedMetadata[key] = value
    }
  }

  return cappedMetadata
}

export const sanitizeSubmitDiagnosticMetadata = (
  metadata: SubmitDiagnosticMetadata = {}
): SanitizedSubmitDiagnosticMetadata => {
  const sanitizedMetadata = sanitizeMetadataValue(metadata)

  if (
    typeof sanitizedMetadata !== 'object' ||
    sanitizedMetadata === null ||
    Array.isArray(sanitizedMetadata)
  ) {
    return {}
  }

  return createSizeCappedMetadata(sanitizedMetadata)
}

type LogSubmitDiagnosticEventInput = {
  sessionId: string
  eventName: string
  step?: string | null
  message?: string | null
  metadata?: SubmitDiagnosticMetadata
  userAgent?: string | null
  screenWidth?: number | null
  screenHeight?: number | null
}

export const logSubmitDiagnosticEvent = async ({
  sessionId,
  eventName,
  step = null,
  message = null,
  metadata = {},
  userAgent = null,
  screenWidth = null,
  screenHeight = null
}: LogSubmitDiagnosticEventInput) => {
  const supabase = createSupabaseServerClient()

  const { error } = await supabase
    .from('submit_diagnostic_events')
    .insert({
      session_id: sessionId,
      event_name: eventName,
      step,
      message,
      metadata: sanitizeSubmitDiagnosticMetadata(metadata),
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

export const safelyLogSubmitDiagnosticEvent = async (
  input: LogSubmitDiagnosticEventInput
) => {
  try {
    await logSubmitDiagnosticEvent(input)
  } catch (error) {
    console.error('Submit diagnostic event failed.', error)
  }
}