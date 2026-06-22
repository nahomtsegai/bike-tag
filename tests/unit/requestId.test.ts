import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ensureEventRequestId, getEventRequestId } from '../../server/utils/requestId'

const getHeaderMock = vi.fn()
const setResponseHeaderMock = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('getHeader', getHeaderMock)
  vi.stubGlobal('setResponseHeader', setResponseHeaderMock)
})

describe('request ID helpers', () => {
  it('preserves a valid incoming request ID', () => {
    getHeaderMock.mockReturnValue('request-from-client')
    const event = { context: {} }

    expect(ensureEventRequestId(event as never)).toBe('request-from-client')
    expect(event.context).toEqual({ requestId: 'request-from-client' })
    expect(setResponseHeaderMock).toHaveBeenCalledWith(
      event,
      'x-request-id',
      'request-from-client'
    )
  })

  it('creates a request ID when the incoming value is invalid', () => {
    getHeaderMock.mockReturnValue('invalid request id')
    const event = { context: {} }

    const requestId = ensureEventRequestId(event as never)

    expect(requestId).toMatch(/^[a-f0-9-]{36}$/)
    expect(getEventRequestId(event as never)).toBe(requestId)
  })

  it('prefers the request ID already stored in event context', () => {
    getHeaderMock.mockReturnValue('request-from-header')
    const event = {
      context: { requestId: 'request-from-context' }
    }

    expect(getEventRequestId(event as never)).toBe('request-from-context')
  })
})
