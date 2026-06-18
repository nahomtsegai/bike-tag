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

const assertAdminRequestAccessMock = vi.hoisted(() => vi.fn())
const fetchAdminAuditHistoryFromSupabaseMock = vi.hoisted(() => vi.fn())
const getQueryMock = vi.hoisted(() => vi.fn())

vi.mock('../../server/utils/adminAuth', () => {
  return {
    assertAdminRequestAccess: assertAdminRequestAccessMock
  }
})

vi.mock('../../server/utils/adminAuditHistory', () => {
  return {
    fetchAdminAuditHistoryFromSupabase:
      fetchAdminAuditHistoryFromSupabaseMock
  }
})

const defineEventHandlerMock = (
  eventHandler: (event: never) => Promise<unknown>
) => {
  return eventHandler
}

beforeAll(async () => {
  vi.stubGlobal('defineEventHandler', defineEventHandlerMock)
  vi.stubGlobal('createError', createTestError)
  vi.stubGlobal('getQuery', getQueryMock)

  handler = (
    await import('../../server/api/admin/audit-events/index.get')
  ).default as typeof handler
})

describe('admin audit events API', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    assertAdminRequestAccessMock.mockResolvedValue({
      authType: 'supabase',
      adminUser: {
        id: 'admin-user-id'
      }
    })
    getQueryMock.mockReturnValue({})
    fetchAdminAuditHistoryFromSupabaseMock.mockResolvedValue({
      events: [
        {
          id: 'audit-event-id',
          action: 'submission.approve',
          outcome: 'succeeded'
        }
      ],
      pagination: {
        limit: 50,
        offset: 0,
        total: 1
      }
    })
  })

  it('returns paginated audit events with default filters', async () => {
    await expect(handler({} as never)).resolves.toEqual({
      success: true,
      events: [
        {
          id: 'audit-event-id',
          action: 'submission.approve',
          outcome: 'succeeded'
        }
      ],
      pagination: {
        limit: 50,
        offset: 0,
        total: 1
      }
    })

    expect(assertAdminRequestAccessMock).toHaveBeenCalledWith(expect.anything())
    expect(fetchAdminAuditHistoryFromSupabaseMock).toHaveBeenCalledWith({
      action: undefined,
      outcome: undefined,
      search: undefined,
      limit: 50,
      offset: 0
    })
  })

  it('accepts action, outcome, search, and pagination filters', async () => {
    getQueryMock.mockReturnValue({
      action: 'submission.reject',
      outcome: 'failed',
      search: 'admin@example.com',
      limit: '25',
      offset: '50'
    })

    await handler({} as never)

    expect(fetchAdminAuditHistoryFromSupabaseMock).toHaveBeenCalledWith({
      action: 'submission.reject',
      outcome: 'failed',
      search: 'admin@example.com',
      limit: 25,
      offset: 50
    })
  })

  it('rejects limits outside the allowed range', async () => {
    getQueryMock.mockReturnValue({
      limit: '101'
    })

    await expect(handler({} as never)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Limit must be between 1 and 100.'
    })

    expect(fetchAdminAuditHistoryFromSupabaseMock).not.toHaveBeenCalled()
  })

  it('rejects negative offsets', async () => {
    getQueryMock.mockReturnValue({
      offset: '-1'
    })

    await expect(handler({} as never)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Offset must be a non-negative integer.'
    })
  })

  it('rejects unsupported action and outcome filters', async () => {
    getQueryMock.mockReturnValue({
      action: 'submission.publish'
    })

    await expect(handler({} as never)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Action filter is invalid.'
    })

    getQueryMock.mockReturnValue({
      outcome: 'cancelled'
    })

    await expect(handler({} as never)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Outcome filter is invalid.'
    })
  })

  it('rejects search text with unsupported characters', async () => {
    getQueryMock.mockReturnValue({
      search: 'admin example'
    })

    await expect(handler({} as never)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage:
        'Search may only contain letters, numbers, and common email or ID characters.'
    })
  })
})
