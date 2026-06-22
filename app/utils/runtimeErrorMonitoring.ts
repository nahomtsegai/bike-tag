export type ClientRuntimeErrorSource =
  | 'client-vue'
  | 'client-app'
  | 'client-window'
  | 'client-promise'

export type ClientRuntimeErrorReport = {
  source: ClientRuntimeErrorSource
  name: string
  message: string
  stack: string | null
  routePath: string
  statusCode: number | null
  requestId: string | null
  screenWidth: number | null
  screenHeight: number | null
}

const maxNameLength = 120
const maxMessageLength = 1_000
const maxStackLength = 8_000
const maxRequestIdLength = 120
const maxRoutePathLength = 300

const getErrorRecord = (error: unknown) => {
  return typeof error === 'object' && error !== null
    ? (error as Record<string, unknown>)
    : {}
}

const normalizeText = (
  value: unknown,
  maxLength: number,
  fallbackValue = ''
) => {
  if (typeof value !== 'string') {
    return fallbackValue
  }

  const normalizedValue = value.trim()

  return normalizedValue
    ? normalizedValue.slice(0, maxLength)
    : fallbackValue
}

const getNestedErrorData = (error: unknown) => {
  const errorData = getErrorRecord(error).data

  return typeof errorData === 'object' && errorData !== null
    ? (errorData as Record<string, unknown>)
    : {}
}

export const getClientRuntimeErrorStatusCode = (error: unknown) => {
  const errorRecord = getErrorRecord(error)
  const errorData = getNestedErrorData(error)
  const statusCode =
    errorRecord.statusCode ??
    errorRecord.status ??
    errorData.statusCode ??
    errorData.status

  return typeof statusCode === 'number' && Number.isFinite(statusCode)
    ? Math.round(statusCode)
    : null
}

export const getClientRuntimeErrorRequestId = (error: unknown) => {
  const errorRecord = getErrorRecord(error)
  const errorData = getNestedErrorData(error)
  const response =
    typeof errorRecord.response === 'object' && errorRecord.response !== null
      ? (errorRecord.response as Record<string, unknown>)
      : {}
  const responseHeaders =
    typeof response.headers === 'object' && response.headers !== null
      ? (response.headers as Record<string, unknown>)
      : {}
  const requestId =
    errorData.requestId ??
    errorRecord.requestId ??
    responseHeaders['x-request-id']

  return normalizeText(requestId, maxRequestIdLength) || null
}

export const shouldReportClientRuntimeError = (error: unknown) => {
  const statusCode = getClientRuntimeErrorStatusCode(error)

  if (statusCode !== null && statusCode < 500) {
    return false
  }

  const errorRecord = getErrorRecord(error)
  const errorName =
    error instanceof Error
      ? error.name
      : normalizeText(errorRecord.name, maxNameLength)
  const errorMessage =
    error instanceof Error
      ? error.message
      : normalizeText(errorRecord.message, maxMessageLength)
  const normalizedMessage = errorMessage.toLowerCase()

  if (errorName === 'AbortError') {
    return false
  }

  return ![
    'navigation aborted',
    'navigation cancelled',
    'failed to fetch dynamically imported module'
  ].some((ignoredMessage) => normalizedMessage.includes(ignoredMessage))
}

export const createClientRuntimeErrorReport = (
  error: unknown,
  source: ClientRuntimeErrorSource,
  options: {
    routePath?: string | null
    context?: string | null
    screenWidth?: number | null
    screenHeight?: number | null
  } = {}
): ClientRuntimeErrorReport => {
  const errorRecord = getErrorRecord(error)
  const name =
    error instanceof Error
      ? error.name
      : normalizeText(errorRecord.name, maxNameLength, 'UnknownError')
  const rawMessage =
    error instanceof Error
      ? error.message
      : normalizeText(errorRecord.message, maxMessageLength) || String(error)
  const context = normalizeText(options.context, 300)
  const message = normalizeText(
    context ? `${rawMessage} (${context})` : rawMessage,
    maxMessageLength,
    'Unexpected client runtime error.'
  )
  const stack = normalizeText(
    error instanceof Error ? error.stack : errorRecord.stack,
    maxStackLength
  )
  const rawRoutePath = normalizeText(
    options.routePath,
    maxRoutePathLength,
    '/'
  )
  const routePath = rawRoutePath.split(/[?#]/, 1)[0] || '/'

  return {
    source,
    name: normalizeText(name, maxNameLength, 'UnknownError'),
    message,
    stack: stack || null,
    routePath: routePath.startsWith('/') ? routePath : `/${routePath}`,
    statusCode: getClientRuntimeErrorStatusCode(error),
    requestId: getClientRuntimeErrorRequestId(error),
    screenWidth:
      typeof options.screenWidth === 'number' &&
      Number.isFinite(options.screenWidth)
        ? Math.round(options.screenWidth)
        : null,
    screenHeight:
      typeof options.screenHeight === 'number' &&
      Number.isFinite(options.screenHeight)
        ? Math.round(options.screenHeight)
        : null
  }
}

export const getClientRuntimeErrorSignature = (
  report: ClientRuntimeErrorReport
) => {
  return [
    report.source,
    report.name,
    report.message,
    report.routePath,
    report.requestId || ''
  ].join('|')
}
