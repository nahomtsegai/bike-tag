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
  'tag.opening.create': 'Opening tag created',
  'game_data.delete': 'Game data deleted'
}

const outcomeLabels: Record<AdminAuditOutcome, string> = {
  started: 'Started',
  succeeded: 'Succeeded',
  failed: 'Failed'
}

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

export const hasAdminAuditMetadata = (event: AdminAuditEvent) => {
  return Object.keys(event.metadata).length > 0
}
