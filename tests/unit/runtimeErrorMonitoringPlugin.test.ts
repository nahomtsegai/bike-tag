import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockGetEventRequestId,
  mockSafelyReportRuntimeError,
  mockGetHeader
} = vi.hoisted(() => {
  return {
    mockGetEventRequestId: vi.fn(),
    mockSafelyReportRuntimeError: vi.fn(),
    mockGetHeader: vi.fn()
  }
})

vi.mock('../../server/utils/requestId', () => {
  return {
    getEventRequestId: mockGetEventRequestId
  }
})

vi.mock('../../server/utils/runtimeErrorMonitoring', async () => {
  const actual = await vi.importActual<
    typeof import('../../server/utils/runtimeErrorMonitoring')
  >('../../server/utils/runtimeErrorMonitoring')

  return {
    ...actual,
    safelyReportRuntimeError: mockSafelyReportRuntimeError
  }
})

type ErrorHook = (
  error: unknown,
  context: {
    event?: {
      method?: string
      path?: string
      context?: Record<string, unknown>
    }
  }
) => Promise<void>

describe('runtime error monitoring Nitro plugin', () => {
  beforeEach(() => {
    vi.resetModules()
    mockGetEventRequestId.mockReset()
    mockSafelyReportRuntimeError.mockReset()
    mockGetHeader.mockReset()
    mockGetEventRequestId.mockReturnValue('request-123')
    mockSafelyReportRuntimeError.mockResolvedValue({
      reported: true,
      eventId: 'event-id'
    })
    mockGetHeader.mockReturnValue('test-agent')
    vi.stubGlobal('getHeader', mockGetHeader)
    vi.stubGlobal('defineNitroPlugin', (plugin: unknown) => plugin)
  })

  it('reports unhandled server failures with request context', async () => {
    const hook = vi.fn()
    const { default: registerPlugin } = await import(
      '../../server/plugins/runtimeErrorMonitoring'
    )

    registerPlugin({ hooks: { hook } } as never)
    const errorHook = hook.mock.calls[0]?.[1] as ErrorHook
    const error = Object.assign(new Error('Database unavailable'), {
      statusCode: 500
    })

    await errorHook(error, {
      event: {
        method: 'GET',
        path: '/api/tags/current?refresh=1',
        context: {}
      }
    })

    expect(mockSafelyReportRuntimeError).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'nitro',
        name: 'Error',
        message: 'Database unavailable',
        routePath: '/api/tags/current',
        method: 'GET',
        statusCode: 500,
        requestId: 'request-123',
        userAgent: 'test-agent'
      })
    )
  })

  it('ignores expected 4xx failures', async () => {
    const hook = vi.fn()
    const { default: registerPlugin } = await import(
      '../../server/plugins/runtimeErrorMonitoring'
    )

    registerPlugin({ hooks: { hook } } as never)
    const errorHook = hook.mock.calls[0]?.[1] as ErrorHook

    await errorHook(
      Object.assign(new Error('Unauthorized'), { statusCode: 401 }),
      {
        event: {
          method: 'GET',
          path: '/api/admin/audit-events',
          context: {}
        }
      }
    )

    expect(mockSafelyReportRuntimeError).not.toHaveBeenCalled()
  })

  it('does not recursively report monitoring endpoint failures', async () => {
    const hook = vi.fn()
    const { default: registerPlugin } = await import(
      '../../server/plugins/runtimeErrorMonitoring'
    )

    registerPlugin({ hooks: { hook } } as never)
    const errorHook = hook.mock.calls[0]?.[1] as ErrorHook

    await errorHook(
      Object.assign(new Error('Provider unavailable'), { statusCode: 500 }),
      {
        event: {
          method: 'POST',
          path: '/api/runtime-errors',
          context: {}
        }
      }
    )

    expect(mockSafelyReportRuntimeError).not.toHaveBeenCalled()
  })
})
