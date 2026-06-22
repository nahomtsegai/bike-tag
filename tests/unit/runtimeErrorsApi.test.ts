import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

let handler: (event: never) => Promise<unknown>

type CreateErrorInput = {
  statusCode: number
  statusMessage: string
}

const createTestError = ({ statusCode, statusMessage }: CreateErrorInput) => {
  const error = new Error(statusMessage) as Error & CreateErrorInput

  error.statusCode = statusCode
  error.statusMessage = statusMessage

  return error
}

const {
  assertRateLimitMock,
  ensureEventRequestIdMock,
  getClientIpAddressMock,
  readBodyMock,
  safelyReportRuntimeErrorMock
} = vi.hoisted(() => {
  return {
    assertRateLimitMock: vi.fn(),
    ensureEventRequestIdMock: vi.fn(),
    getClientIpAddressMock: vi.fn(),
    readBodyMock: vi.fn(),
    safelyReportRuntimeErrorMock: vi.fn()
  }
})

vi.mock('../../server/utils/rateLimit', () => {
  return {
    assertRateLimit: assertRateLimitMock,
    getClientIpAddress: getClientIpAddressMock,
    getPositiveNumberConfig: (value: unknown, fallback: number) => {
      return typeof value === 'number' && value > 0 ? value : fallback
    }
  }
})

vi.mock('../../server/utils/requestId', () => {
  return {
    ensureEventRequestId: ensureEventRequestIdMock
  }
})

vi.mock('../../server/utils/runtimeErrorMonitoring', () => {
  return {
    safelyReportRuntimeError: safelyReportRuntimeErrorMock
  }
})

beforeAll(async () => {
  vi.stubGlobal('defineEventHandler', (eventHandler: unknown) => eventHandler)
  vi.stubGlobal('createError', createTestError)
  vi.stubGlobal('readBody', readBodyMock)
  vi.stubGlobal('getHeader', vi.fn(() => 'test-agent'))
  vi.stubGlobal('useRuntimeConfig', () => ({
    runtimeErrorRateLimitAttempts: 20,
    runtimeErrorRateLimitWindowMs: 600_000
  }))

  handler = (
    await import('../../server/api/runtime-errors.post')
  ).default as typeof handler
})

describe('runtime errors API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    assertRateLimitMock.mockResolvedValue(undefined)
    getClientIpAddressMock.mockReturnValue('127.0.0.1')
    ensureEventRequestIdMock.mockReturnValue('server-request-id')
    safelyReportRuntimeErrorMock.mockResolvedValue({
      reported: true,
      eventId: 'event-id'
    })
    readBodyMock.mockResolvedValue({
      source: 'client-vue',
      name: 'Error',
      message: 'Component render failed',
      stack: 'Error: Component render failed',
      routePath: '/submit?step=review',
      statusCode: 500,
      requestId: 'client-request-id',
      screenWidth: 430,
      screenHeight: 932
    })
  })

  it('rate limits and forwards bounded client error context', async () => {
    await expect(handler({} as never)).resolves.toEqual({
      success: true,
      reported: true,
      eventId: 'event-id',
      requestId: 'server-request-id'
    })

    expect(assertRateLimitMock).toHaveBeenCalledWith({
      key: 'runtime-errors:127.0.0.1',
      limit: 20,
      windowMs: 600_000,
      messagePrefix: 'Too many runtime error reports.'
    })
    expect(safelyReportRuntimeErrorMock).toHaveBeenCalledWith({
      source: 'client-vue',
      name: 'Error',
      message: 'Component render failed',
      stack: 'Error: Component render failed',
      routePath: '/submit?step=review',
      method: 'CLIENT',
      statusCode: 500,
      requestId: 'client-request-id',
      userAgent: 'test-agent',
      screenWidth: 430,
      screenHeight: 932
    })
  })

  it('uses the server request ID when the client has none', async () => {
    readBodyMock.mockResolvedValue({
      source: 'client-window',
      name: 'TypeError',
      message: 'Unexpected failure'
    })

    await handler({} as never)

    expect(safelyReportRuntimeErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'server-request-id'
      })
    )
  })

  it('rejects unsupported report sources', async () => {
    readBodyMock.mockResolvedValue({
      source: 'nitro',
      name: 'Error',
      message: 'Invalid client source'
    })

    await expect(handler({} as never)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Runtime error source is invalid.'
    })

    expect(safelyReportRuntimeErrorMock).not.toHaveBeenCalled()
  })
})
