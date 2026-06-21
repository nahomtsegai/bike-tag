import { describe, expect, it } from 'vitest'
import type { AdminAuditEvent } from '../../app/types/adminAuditEvents'
import {
  formatAdminAuditAction,
  formatAdminAuditOutcome,
  formatAdminAuditTarget,
  getAdminAuditAgeLabel,
  getAdminAuditDurationLabel,
  getAdminAuditOutcomeClass,
  getAdminAuditSubmissionLink,
  hasAdminAuditMetadata,
  isAdminAuditEventIncomplete
} from '../../app/utils/adminAuditEvents'

const createAuditEvent = (
  overrides: Partial<AdminAuditEvent> = {}
): AdminAuditEvent => {
  return {
    id: 'event-id',
    action: 'submission.approve',
    outcome: 'succeeded',
    actorAdminUserId: 'admin-id',
    actorAuthUserId: 'auth-id',
    actorEmail: 'admin@example.com',
    targetType: 'submission',
    targetId: 'submission-id',
    requestId: 'request-id',
    metadata: {},
    errorCode: null,
    errorMessage: null,
    createdAt: '2026-06-18T12:00:00.000Z',
    completedAt: '2026-06-18T12:00:01.500Z',
    ...overrides
  }
}

describe('admin audit event display helpers', () => {
  it('formats actions and outcomes for admins', () => {
    expect(formatAdminAuditAction('submission.approve')).toBe(
      'Submission approved'
    )
    expect(formatAdminAuditAction('game_data.delete')).toBe(
      'Game data deleted'
    )
    expect(formatAdminAuditAction('notification.retry')).toBe(
      'Notification retried'
    )
    expect(formatAdminAuditOutcome('failed')).toBe('Failed')
    expect(getAdminAuditOutcomeClass('started')).toBe(
      'audit-outcome-started'
    )
  })

  it('formats targets and submission links', () => {
    const event = createAuditEvent()

    expect(formatAdminAuditTarget(event)).toBe(
      'submission: submission-id'
    )
    expect(getAdminAuditSubmissionLink(event)).toEqual({
      path: '/admin/submissions',
      query: {
        search: 'submission-id'
      }
    })

    expect(
      getAdminAuditSubmissionLink(
        createAuditEvent({ targetType: 'tag', targetId: 'tag-id' })
      )
    ).toBeNull()
  })

  it('formats completed and in-progress durations', () => {
    expect(getAdminAuditDurationLabel(createAuditEvent())).toBe('1.5 s')
    expect(
      getAdminAuditDurationLabel(
        createAuditEvent({ completedAt: null, outcome: 'started' })
      )
    ).toBe('In progress')
  })

  it('identifies stale started events and formats their age', () => {
    const incompleteEvent = createAuditEvent({
      completedAt: null,
      outcome: 'started'
    })
    const tenMinutesLater = new Date('2026-06-18T12:10:00.000Z').getTime()
    const fourMinutesLater = new Date('2026-06-18T12:04:00.000Z').getTime()

    expect(isAdminAuditEventIncomplete(incompleteEvent, tenMinutesLater)).toBe(
      true
    )
    expect(isAdminAuditEventIncomplete(incompleteEvent, fourMinutesLater)).toBe(
      false
    )
    expect(getAdminAuditAgeLabel(incompleteEvent, tenMinutesLater)).toBe(
      '10 minutes old'
    )
    expect(
      isAdminAuditEventIncomplete(
        createAuditEvent({ outcome: 'failed' }),
        tenMinutesLater
      )
    ).toBe(false)
  })

  it('detects metadata and empty targets', () => {
    expect(hasAdminAuditMetadata(createAuditEvent())).toBe(false)
    expect(
      hasAdminAuditMetadata(createAuditEvent({ metadata: { count: 3 } }))
    ).toBe(true)
    expect(
      formatAdminAuditTarget(
        createAuditEvent({ targetType: null, targetId: null })
      )
    ).toBe('No target recorded')
  })
})
