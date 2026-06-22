export type RuntimeErrorSource =
  | 'nitro'
  | 'client-vue'
  | 'client-app'
  | 'client-window'
  | 'client-promise'

export type RuntimeErrorReportInput = {
  source: RuntimeErrorSource
  name: string
  message: string
  stack?: string | null
  routePath?: string | null
  method?: string | null
  statusCode?: number | null
  requestId?: string | null
  userAgent?: string | null
  screenWidth?: number | null
  screenHeight?: number | null
}

type RuntimeErrorMonitoringConfig = {
  dsn: string
  environment: string
  release: string | null
}

type SentryEventPayload = {
  event_id: string
  timestamp: string
  platform: 'javascript'
  level: 'error'
  logger: string
  environment: string
  release?: string
  transaction?: string
  message: string
  exception: {
    values: Array<{
      type: string
      value: string
      mechanism: {
        type: RuntimeErrorSource
        handled: false
      }
    }>
  }
  tags: Record<string, string>
  request?: {
    url?: string
    method?: string
    headers?: Record<string, string>
  }
  contexts: {
    runtime: Record<string, string | number>
    device?: Record<string, number>
  }
  extra?: {
    stack?: string
  }
}

const maxNameLength = 120
const maxMessageLength = 1_000
const maxStackLength = 8_000
const maxPathLength = 300
const maxRequestIdLength = 120
const maxUserAgentLength = 300
const sentryClientName = 'bike-tag-runtime/1.0'

const normalizeText = (
  value: unknown,
  maxLength: number,
  fallbackValue = ''
) => {
  if (typeof value !== 'string') {
    return fallbackValue
  }

  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return fallbackValue
  }

  return normalizedValue.slice(0, maxLength)
}

export const sanitizeRuntimeErrorPath = (value: unknown) => {
  const normalizedValue = normalizeText(value, maxPathLength)

  if (!normalizedValue) {
    return null
  }

  const pathOnly = normalizedValue.split(/[?#]/, 1)[0] || '/'

  return pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`
}

export const getRuntimeErrorStatusCode = (error: unknown) => {
  if (typeof error !== 'object' || error === null) {
    return null
  }

  const errorRecord = error as Record<string, unknown>
  const statusCode = errorRecord.statusCode ?? errorRecord.status

  return typeof statusCode === 'number' && Number.isFinite(statusCode)
    ? Math.round(statusCode)
    : null
}

export const getRuntimeErrorRequestId = (error: unknown) => {
  if (typeof error !== 'object' || error === null) {
    return null
  }

  const errorRecord = error as Record<string, unknown>
  const errorData =
    typeof errorRecord.data === 'object' && errorRecord.data !== null
      ? (errorRecord.data as Record<string, unknown>)
      : {}
  const requestId = errorData.requestId ?? errorRecord.requestId

  return normalizeText(requestId, maxRequestIdLength) || null
}

export const shouldReportRuntimeError = (error: unknown) => {
  const statusCode = getRuntimeErrorStatusCode(error)

  if (statusCode !== null && statusCode < 500) {
    return false
  }

  const errorName =
    error instanceof Error
      ? error.name
      : typeof error === 'object' && error !== null
        ? normalizeText(
            (error as Record<string, unknown>).name,
            maxNameLength
          )
        : ''

  return errorName !== 'AbortError'
}

export const parseSentryDsn = (dsn: string) => {
  try {
    const dsnUrl = new URL(dsn)
    const pathParts = dsnUrl.pathname.split('/').filter(Boolean)
    const projectId = pathParts.pop()
    const publicKey = dsnUrl.username

    if (
      !['http:', 'https:'].includes(dsnUrl.protocol) ||
      !projectId ||
      !publicKey
    ) {
      return null
    }

    const pathPrefix = pathParts.length ? `/${pathParts.join('/')}` : ''
    const envelopeUrl = new URL(
      `${pathPrefix}/api/${projectId}/envelope/`,
      dsnUrl.origin
    )

    envelopeUrl.searchParams.set('sentry_version', '7')
    envelopeUrl.searchParams.set('sentry_key', publicKey)
    envelopeUrl.searchParams.set('sentry_client', sentryClientName)

    return {
      endpoint: envelopeUrl.toString(),
      dsn: `${dsnUrl.protocol}//${publicKey}@${dsnUrl.host}${dsnUrl.pathname}`
    }
  } catch {
    return null
  }
}

const getRuntimeErrorMonitoringConfig = (): RuntimeErrorMonitoringConfig => {
  const runtimeConfig = useRuntimeConfig()
  const configuredDsn = normalizeText(runtimeConfig.sentryDsn, 2_000)
  const configuredEnvironment = normalizeText(
    runtimeConfig.sentryEnvironment,
    100
  )
  const configuredRelease = normalizeText(runtimeConfig.sentryRelease, 200)

  return {
    dsn: configuredDsn || normalizeText(process.env.SENTRY_DSN, 2_000),
    environment:
      configuredEnvironment ||
      normalizeText(process.env.SENTRY_ENVIRONMENT, 100) ||
      normalizeText(process.env.VERCEL_ENV, 100) ||
      normalizeText(process.env.NODE_ENV, 100, 'production'),
    release:
      configuredRelease ||
      normalizeText(process.env.SENTRY_RELEASE, 200) ||
      normalizeText(process.env.VERCEL_GIT_COMMIT_SHA, 200) ||
      null
  }
}

const getRuntimeErrorName = (input: RuntimeErrorReportInput) => {
  return normalizeText(input.name, maxNameLength, 'Error')
}

const getRuntimeErrorMessage = (input: RuntimeErrorReportInput) => {
  return normalizeText(
    input.message,
    maxMessageLength,
    'Unexpected runtime error.'
  )
}

const createSentryEventPayload = (
  input: RuntimeErrorReportInput,
  config: RuntimeErrorMonitoringConfig,
  eventId: string
): SentryEventPayload => {
  const name = getRuntimeErrorName(input)
  const message = getRuntimeErrorMessage(input)
  const routePath = sanitizeRuntimeErrorPath(input.routePath)
  const method = normalizeText(input.method, 20).toUpperCase()
  const requestId = normalizeText(input.requestId, maxRequestIdLength)
  const userAgent = normalizeText(input.userAgent, maxUserAgentLength)
  const stack = normalizeText(input.stack, maxStackLength)
  const tags: Record<string, string> = {
    source: input.source
  }
  const runtimeContext: Record<string, string | number> = {
    source: input.source
  }

  if (requestId) {
    tags.request_id = requestId
    runtimeContext.request_id = requestId
  }

  if (input.statusCode !== null && input.statusCode !== undefined) {
    tags.status_code = String(input.statusCode)
    runtimeContext.status_code = input.statusCode
  }

  if (method) {
    tags.method = method
    runtimeContext.method = method
  }

  const payload: SentryEventPayload = {
    event_id: eventId,
    timestamp: new Date().toISOString(),
    platform: 'javascript',
    level: 'error',
    logger: 'bike-tag.runtime-monitoring',
    environment: config.environment,
    message: `${name}: ${message}`,
    exception: {
      values: [
        {
          type: name,
          value: message,
          mechanism: {
            type: input.source,
            handled: false
          }
        }
      ]
    },
    tags,
    contexts: {
      runtime: runtimeContext
    }
  }

  if (config.release) {
    payload.release = config.release
  }

  if (routePath) {
    payload.transaction = routePath
    payload.request = {
      url: routePath
    }

    if (method) {
      payload.request.method = method
    }

    if (userAgent) {
      payload.request.headers = {
        'User-Agent': userAgent
      }
    }
  }

  if (
    input.screenWidth !== null &&
    input.screenWidth !== undefined &&
    input.screenHeight !== null &&
    input.screenHeight !== undefined
  ) {
    payload.contexts.device = {
      screen_width: Math.round(input.screenWidth),
      screen_height: Math.round(input.screenHeight)
    }
  }

  if (stack) {
    payload.extra = {
      stack
    }
  }

  return payload
}

export const createSentryEnvelope = (
  input: RuntimeErrorReportInput,
  config: RuntimeErrorMonitoringConfig,
  eventId: string
) => {
  const payload = JSON.stringify(
    createSentryEventPayload(input, config, eventId)
  )
  const payloadLength = new TextEncoder().encode(payload).byteLength
  const envelopeHeader = JSON.stringify({
    event_id: eventId,
    sent_at: new Date().toISOString(),
    dsn: config.dsn,
    sdk: {
      name: 'bike-tag-runtime',
      version: '1.0'
    }
  })
  const itemHeader = JSON.stringify({
    type: 'event',
    content_type: 'application/json',
    length: payloadLength
  })

  return `${envelopeHeader}\n${itemHeader}\n${payload}\n`
}

export const reportRuntimeError = async (input: RuntimeErrorReportInput) => {
  const config = getRuntimeErrorMonitoringConfig()
  const sentryDsn = parseSentryDsn(config.dsn)

  if (!sentryDsn) {
    return {
      reported: false,
      eventId: null
    }
  }

  const eventId = crypto.randomUUID().replaceAll('-', '').toLowerCase()
  const response = await fetch(sentryDsn.endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-sentry-envelope'
    },
    body: createSentryEnvelope(
      input,
      {
        ...config,
        dsn: sentryDsn.dsn
      },
      eventId
    ),
    signal: AbortSignal.timeout(3_000)
  })

  if (!response.ok) {
    throw new Error(`Sentry rejected runtime error event (${response.status}).`)
  }

  return {
    reported: true,
    eventId
  }
}

export const safelyReportRuntimeError = async (
  input: RuntimeErrorReportInput
) => {
  try {
    return await reportRuntimeError(input)
  } catch (error) {
    console.error('Runtime error monitoring failed.', error)

    return {
      reported: false,
      eventId: null
    }
  }
}
