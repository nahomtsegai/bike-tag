import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

let handler: (event: never) => Promise<unknown>

const assertAdminRequestAccessMock = vi.hoisted(() => vi.fn())
const retryFailedSubmissionNotificationMock = vi.hoisted(() => vi.fn())
const runAdminAuditedActionMock = vi.hoisted(() =>
  vi.fn(async ({ execute }: { execute: () => Promise<unknown> }) => {
    return await execute()
  })
)
const getRouterParamMock = vi.hoisted(() => vi.fn())

vi.mock('../../server/utils/adminAuth', () => ({
  assertAdminRequestAccess: assertAdminRequestAccessMock
}))

vi.mock('../../server/utils/adminAudit', () => ({
  runAdminAuditedAction: runAdminAuditedActionMock
}))

vi.mock('../../server/utils/submissionNotificationDelivery', () => ({
  retryFailedSubmissionNotification: retryFailedSubmissionNotificationMock
}))

const adminUser = {
  id: 'admin-user-id',
  user_id: 'auth-user-id',
  email: 'admin@example.com'
}

beforeAll(async () => {
  vi.stubGlobal('defineEventHandler', (eventHandler: typeof handler) => eventHandler)
  vi.stubGlobal('getRouterParam', getRouterParamMock)
  vi.stubGlobal('createError', ({ statusCode, statusMessage }) =>
    Object.assign(new Error(statusMessage), { statusCode, statusMessage })
  )

  handler = (
    await import('../../server/api/admin/notifications/[id]/retry.post')
  ).default as typeof handler
})

describe('notification retry API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getRouterParamMock.mockReturnValue(
      '11111111-1111-4111-8111-111111111111'
    )
    assertAdminRequestAccessMock.mockResolvedValue({
      authType: 'supabase',
      adminUser
    })
    retryFailedSubmissionNotificationMock.mockResolvedValue({
      attemptId: '22222222-2222-4222-8222-222222222222',
      attemptNumber: 2,
      status: 'sent'
    })
  })

  it('audits and retries a failed notification attempt', async () => {
    await expect(handler({} as never)).resolves.toEqual({
      success: true,
      message: 'Notification retry sent.',
      attemptId: '22222222-2222-4222-8222-222222222222',
      attemptNumber: 2,
      status: 'sent'
    })

    expect(runAdminAuditedActionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'notification.retry',
        actor: adminUser,
        targetType: 'notification_attempt',
        targetId: '11111111-1111-4111-8111-111111111111'
      })
    )
    expect(retryFailedSubmissionNotificationMock).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111'
    )
  })
})
