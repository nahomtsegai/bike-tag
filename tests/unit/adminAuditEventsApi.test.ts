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
const fetchAdminAuditEventsFromSupabaseMock = vi.hoisted(() => vi.fn())
const getQueryMock = vi.hoisted(() => vi.fn())

vi.mock('../../server/utils/adminAuth', () => {
  return {
    assertAdminRequestAccess: assertAdminRequestAccessMock
  }
})

vi.mock('../../server/utils/adminAudit', () => {
  return {
    fetchAdminAuditEventsFromSupabase:
      fetchAdminAuditEventsFromSupabaseMock
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
    fetchAdminAuditEventsFromSupabaseMock.mockResolvedValue({
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

  it('returns paginated audit events with default pagination', async () => {
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
    expect(fetchAdminAuditEventsFromSupabaseMock).toHaveBeenCalledWith({
      limit: 50,
      offset: 0
    })
  })

  it('accepts custom pagination values', async () => {
    getQueryMock.mockReturnValue({
      limit: '25',
      offset: '50'
    })

    await handler({} as never)

    expect(fetchAdminAuditEventsFromSupabaseMock).toHaveBeenCalledWith({
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

    expect(fetchAdminAuditEventsFromSupabaseMock).not.toHaveBeenCalled()
  })

  it('rejects negative offsets', async () => {
    getQueryMock.mockReturnValue({
      offset: '-1'
    })

    await expect(handler({} as never)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Offset must be a positive integer.'
    })

    expect(fetchAdminAuditEventsFromSupabaseMock).not.toHaveBeenCalled()
  })
})
