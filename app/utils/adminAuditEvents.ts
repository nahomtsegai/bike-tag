import type {
  AdminAuditAction,
  AdminAuditEvent,
  AdminAuditOutcome
} from '~/types/adminAuditEvents'

const actionLabels: Record<AdminAuditAction, string> = {
  'admin.login': 'Admin login',
  'submission.approve': 'Submission approved',
  'submission.reject': 'Submission rejected',
  'submission.archive': 'Submission archived',
  'submission.delete': 'Submission deleted',
  'notification.retry': 'Notification retried',
  'tag.opening.create': 'Opening tag created',
  'game_data.delete': 'Game data deleted'
}

const outcomeLabels: Record<AdminAuditOutcome, string> = {
  started: 'Started',
  succeeded: 'Succeeded',
  failed: 'Failed'
}

export const adminAuditIncompleteAfterMs = 5 * 60 * 1_000

export const formatAdminAuditAction = (action: AdminAuditAction) => {
  return actionLabels[action]
}

export const formatAdminAuditOutcome = (outcome: AdminAuditOutcome) => {
  return outcomeLabels[outcome]
}

export const getAdminAuditOutcomeClass = (outcome: AdminAuditOutcome) => {
  return `audit-outcome-${outcome}`
}

export const formatAdminAuditTarget = (event: AdminAuditEvent) => {
  if (!event.targetType && !event.targetId) {
    return 'No target recorded'
  }

  if (!event.targetId) {
    return event.targetType || 'Unknown target'
  }

  if (!event.targetType) {
    return event.targetId
  }

  return `${event.targetType}: ${event.targetId}`
}

export const getAdminAuditSubmissionLink = (event: AdminAuditEvent) => {
  if (event.targetType !== 'submission' || !event.targetId) {
    return null
  }

  return {
    path: '/admin/submissions',
    query: {
      search: event.targetId
    }
  }
}

export const getAdminAuditDurationLabel = (event: AdminAuditEvent) => {
  if (!event.completedAt) {
    return 'In progress'
  }

  const startedAt = new Date(event.createdAt).getTime()
  const completedAt = new Date(event.completedAt).getTime()
  const durationMs = completedAt - startedAt

  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return 'Unavailable'
  }

  if (durationMs < 1_000) {
    return `${durationMs} ms`
  }

  return `${(durationMs / 1_000).toFixed(1)} s`
}

export const getAdminAuditAgeLabel = (
  event: AdminAuditEvent,
  now = Date.now()
) => {
  const createdAt = new Date(event.createdAt).getTime()
  const ageMs = now - createdAt

  if (!Number.isFinite(ageMs) || ageMs < 0) {
    return 'Age unavailable'
  }

  if (ageMs < 60_000) {
    return 'Less than a minute old'
  }

  if (ageMs < 60 * 60_000) {
    const minutes = Math.floor(ageMs / 60_000)
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} old`
  }

  if (ageMs < 24 * 60 * 60_000) {
    const hours = Math.floor(ageMs / (60 * 60_000))
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} old`
  }

  const days = Math.floor(ageMs / (24 * 60 * 60_000))
  return `${days} ${days === 1 ? 'day' : 'days'} old`
}

export const isAdminAuditEventIncomplete = (
  event: AdminAuditEvent,
  now = Date.now()
) => {
  if (event.outcome !== 'started' || event.completedAt) {
    return false
  }

  const createdAt = new Date(event.createdAt).getTime()

  return (
    Number.isFinite(createdAt) &&
    now - createdAt >= adminAuditIncompleteAfterMs
  )
}

export const hasAdminAuditMetadata = (event: AdminAuditEvent) => {
  return Object.keys(event.metadata).length > 0
}
