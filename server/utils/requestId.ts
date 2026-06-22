import type { H3Event } from 'h3'

const maxRequestIdLength = 120
const requestIdPattern = /^[a-zA-Z0-9._:-]+$/

const normalizeRequestId = (value: unknown) => {
  if (typeof value !== 'string') {
    return null
  }

  const requestId = value.trim()

  if (
    !requestId ||
    requestId.length > maxRequestIdLength ||
    !requestIdPattern.test(requestId)
  ) {
    return null
  }

  return requestId
}

export const getEventRequestId = (event?: H3Event | null) => {
  if (!event) {
    return null
  }

  const contextRequestId = normalizeRequestId(
    (event.context as Record<string, unknown>).requestId
  )

  if (contextRequestId) {
    return contextRequestId
  }

  return normalizeRequestId(getHeader(event, 'x-request-id'))
}

export const ensureEventRequestId = (event: H3Event) => {
  const requestId =
    getEventRequestId(event) || crypto.randomUUID().toLowerCase()

  ;(event.context as Record<string, unknown>).requestId = requestId
  setResponseHeader(event, 'x-request-id', requestId)

  return requestId
}
