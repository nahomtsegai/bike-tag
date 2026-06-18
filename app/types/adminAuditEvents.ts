export type AdminAuditAction =
  | 'admin.login'
  | 'submission.approve'
  | 'submission.reject'
  | 'submission.archive'
  | 'submission.delete'
  | 'tag.opening.create'
  | 'game_data.delete'

export type AdminAuditOutcome = 'started' | 'succeeded' | 'failed'

export type AdminAuditEvent = {
  id: string
  action: AdminAuditAction
  outcome: AdminAuditOutcome
  actorAdminUserId: string | null
  actorAuthUserId: string | null
  actorEmail: string | null
  targetType: string | null
  targetId: string | null
  requestId: string
  metadata: Record<string, unknown>
  errorCode: string | null
  errorMessage: string | null
  createdAt: string
  completedAt: string | null
}

export type AdminAuditEventsPagination = {
  limit: number
  offset: number
  total: number
  hasMore: boolean
}

export type AdminAuditEventsResponse = {
  success: boolean
  events: AdminAuditEvent[]
  pagination: AdminAuditEventsPagination
}
