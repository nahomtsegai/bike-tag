import {
  getRuntimeErrorRequestId,
  getRuntimeErrorStatusCode,
  safelyReportRuntimeError,
  sanitizeRuntimeErrorPath,
  shouldReportRuntimeError
} from '../utils/runtimeErrorMonitoring'
import { getEventRequestId } from '../utils/requestId'

const runtimeErrorEndpoint = '/api/runtime-errors'

const getErrorName = (error: unknown) => {
  if (error instanceof Error && error.name) {
    return error.name
  }

  if (typeof error === 'object' && error !== null) {
    const name = (error as Record<string, unknown>).name

    if (typeof name === 'string' && name) {
      return name
    }
  }

  return 'UnknownError'
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'object' && error !== null) {
    const message = (error as Record<string, unknown>).message

    if (typeof message === 'string' && message) {
      return message
    }
  }

  return String(error)
}

const getErrorStack = (error: unknown) => {
  if (error instanceof Error) {
    return error.stack || null
  }

  if (typeof error === 'object' && error !== null) {
    const stack = (error as Record<string, unknown>).stack

    return typeof stack === 'string' ? stack : null
  }

  return null
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', async (error, context) => {
    if (!shouldReportRuntimeError(error)) {
      return
    }

    const event = context.event
    const routePath = sanitizeRuntimeErrorPath(event?.path)

    if (routePath === runtimeErrorEndpoint) {
      return
    }

    await safelyReportRuntimeError({
      source: 'nitro',
      name: getErrorName(error),
      message: getErrorMessage(error),
      stack: getErrorStack(error),
      routePath,
      method: event?.method || null,
      statusCode: getRuntimeErrorStatusCode(error),
      requestId:
        getRuntimeErrorRequestId(error) || getEventRequestId(event) || null,
      userAgent: event ? getHeader(event, 'user-agent') || null : null
    })
  })
})
