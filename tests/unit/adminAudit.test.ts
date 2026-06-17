import { beforeEach, describe, expect, it, vi } from 'vitest'

import { runAdminAuditedAction } from '../../server/utils/adminAudit'

const createSupabaseServerClientMock = vi.hoisted(() => vi.fn())

vi.mock('../../server/utils/supabase', () => {
  return {
    createSupabaseServerClient: createSupabaseServerClientMock
  }
})

const insertSingleMock = vi.fn()
const insertSelectMock = vi.fn(() => ({
  single: insertSingleMock
}))
const insertMock = vi.fn(() => ({
  select: insertSelectMock
}))
const updateEqMock = vi.fn()
const updateMock = vi.fn(() => ({
  eq: updateEqMock
}))
const fromMock = vi.fn(() => ({
  insert: insertMock,
  update: updateMock
}))

const createEvent = () => {
  return {
    node: {
      req: {
        headers: {
          'x-request-id': 'request-123'
        }
      }
    }
  }
}

const actor = {
  id: 'admin-user-id',
  user_id: 'auth-user-id',
  email: 'admin@example.com'
}

describe('admin audit logging', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    createSupabaseServerClientMock.mockReturnValue({
      from: fromMock
    })
    insertSingleMock.mockResolvedValue({
      data: {
        id: 'audit-event-id'
      },
      error: null
    })
    updateEqMock.mockResolvedValue({
      error: null
    })
  })

  it('records started and succeeded states around an admin action', async () => {
    const execute = vi.fn().mockResolvedValue({
      submissionId: 'submission-id'
    })

    await expect(
      runAdminAuditedAction({
        event: createEvent() as never,
        action: 'submission.approve',
        actor,
        targetType: 'submission',
        targetId: 'submission-id',
        metadata: {
          reviewedBy: 'Nahom',
          ignored: undefined
        },
        execute
      })
    ).resolves.toEqual({
      submissionId: 'submission-id'
    })

    expect(insertMock).toHaveBeenCalledWith({
      action: 'submission.approve',
      outcome: 'started',
      actor_admin_user_id: actor.id,
      actor_auth_user_id: actor.user_id,
      actor_email: actor.email,
      target_type: 'submission',
      target_id: 'submission-id',
      request_id: 'request-123',
      metadata: {
        reviewedBy: 'Nahom'
      }
    })
    expect(execute).toHaveBeenCalledOnce()
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome: 'succeeded',
        error_code: null,
        error_message: null,
        completed_at: expect.any(String)
      })
    )
    expect(updateEqMock).toHaveBeenCalledWith('id', 'audit-event-id')
  })

  it('records failed states and rethrows the action error', async () => {
    const actionError = Object.assign(new Error('Submission is no longer pending.'), {
      statusCode: 409,
      statusMessage: 'Submission is no longer pending.'
    })

    await expect(
      runAdminAuditedAction({
        event: createEvent() as never,
        action: 'submission.reject',
        actor,
        targetType: 'submission',
        targetId: 'submission-id',
        execute: async () => {
          throw actionError
        }
      })
    ).rejects.toBe(actionError)

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome: 'failed',
        error_code: '409',
        error_message: 'Submission is no longer pending.',
        completed_at: expect.any(String)
      })
    )
  })

  it('fails closed before executing when the audit event cannot be created', async () => {
    const execute = vi.fn()

    insertSingleMock.mockResolvedValueOnce({
      data: null,
      error: {
        message: 'relation does not exist'
      }
    })

    await expect(
      runAdminAuditedAction({
        event: createEvent() as never,
        action: 'submission.delete',
        actor,
        targetType: 'submission',
        targetId: 'submission-id',
        execute
      })
    ).rejects.toMatchObject({
      statusCode: 503,
      statusMessage: 'Admin audit logging is temporarily unavailable.'
    })

    expect(execute).not.toHaveBeenCalled()
  })

  it('does not hide a successful action when the completion update fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    updateEqMock.mockResolvedValueOnce({
      error: {
        message: 'update failed'
      }
    })

    await expect(
      runAdminAuditedAction({
        event: createEvent() as never,
        action: 'submission.archive',
        actor,
        targetType: 'submission',
        targetId: 'submission-id',
        execute: async () => 'archived'
      })
    ).resolves.toBe('archived')

    expect(consoleError).toHaveBeenCalledWith(
      '[admin-audit] Could not complete audit event.',
      expect.objectContaining({
        auditEventId: 'audit-event-id',
        outcome: 'succeeded'
      })
    )

    consoleError.mockRestore()
  })
})
