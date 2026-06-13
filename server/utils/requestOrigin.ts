import {
  createError,
  getHeader,
  getRequestURL
} from 'h3'
import type { H3Event } from 'h3'

const adminApiPath = '/api/admin'

const protectedAdminMutationMethods = new Set([
  'POST',
  'PUT',
  'PATCH',
  'DELETE'
])

type ShouldProtectAdminMutationRequestInput = {
  method: string
  pathname: string
}

export const shouldProtectAdminMutationRequest = ({
  method,
  pathname
}: ShouldProtectAdminMutationRequestInput) => {
  const normalizedMethod = method.trim().toUpperCase()

  const isAdminApiPath =
    pathname === adminApiPath ||
    pathname.startsWith(`${adminApiPath}/`)

  return (
    isAdminApiPath &&
    protectedAdminMutationMethods.has(normalizedMethod)
  )
}

type IsAllowedRequestOriginInput = {
  originHeader?: string | null
  requestUrl: string | URL
}

export const isAllowedRequestOrigin = ({
  originHeader,
  requestUrl
}: IsAllowedRequestOriginInput) => {
  const normalizedOriginHeader = originHeader?.trim()

  if (!normalizedOriginHeader || normalizedOriginHeader === 'null') {
    return false
  }

  try {
    const submittedOrigin = new URL(normalizedOriginHeader).origin
    const expectedOrigin = new URL(requestUrl).origin

    return submittedOrigin === expectedOrigin
  } catch {
    return false
  }
}

export const assertSameOriginRequest = (event: H3Event) => {
  const originHeader = getHeader(event, 'origin')
  const requestUrl = getRequestURL(event, {
    xForwardedHost: true,
    xForwardedProto: true
  })

  if (
    !isAllowedRequestOrigin({
      originHeader,
      requestUrl
    })
  ) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin request origin is not allowed.'
    })
  }
}