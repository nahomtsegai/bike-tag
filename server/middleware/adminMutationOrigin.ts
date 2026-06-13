import {
  getMethod,
  getRequestURL
} from 'h3'

import {
  assertSameOriginRequest,
  shouldProtectAdminMutationRequest
} from '../utils/requestOrigin'

export default defineEventHandler((event) => {
  const method = getMethod(event)
  const pathname = getRequestURL(event).pathname

  if (
    !shouldProtectAdminMutationRequest({
      method,
      pathname
    })
  ) {
    return
  }

  assertSameOriginRequest(event)
})