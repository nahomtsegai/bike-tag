import type {
  AdminAuditAction,
  AdminAuditEvent,
  AdminAuditEventsResponse,
  AdminAuditOutcome
} from '~/types/adminAuditEvents'

type AdminAuditEventApiRecord = {
  id: string
  action: AdminAuditAction
  outcome: AdminAuditOutcome
  actor_admin_user_id: string | null
  actor_auth_user_id: string | null
  actor_email: string | null
  target_type: string | null
  target_id: string | null
  request_id: string
  metadata: Record<string, unknown> | null
  error_code: string | null
  error_message: string | null
  created_at: string
  completed_at: string | null
}

type AdminAuditEventsApiResponse = {
  success: boolean
  events: AdminAuditEventApiRecord[]
  pagination: {
    limit: number
    offset: number
    total: number
  }
}

type GetAdminAuditEventsOptions = {
  action: AdminAuditAction | ''
  outcome: AdminAuditOutcome | ''
  search: string
  limit: number
  offset: number
}

const mapAdminAuditEvent = (
  event: AdminAuditEventApiRecord
): AdminAuditEvent => {
  return {
    id: event.id,
    action: event.action,
    outcome: event.outcome,
    actorAdminUserId: event.actor_admin_user_id,
    actorAuthUserId: event.actor_auth_user_id,
    actorEmail: event.actor_email,
    targetType: event.target_type,
    targetId: event.target_id,
    requestId: event.request_id,
    metadata: event.metadata || {},
    errorCode: event.error_code,
    errorMessage: event.error_message,
    createdAt: event.created_at,
    completedAt: event.completed_at
  }
}

export const getAdminAuditEvents = async ({
  action,
  outcome,
  search,
  limit,
  offset
}: GetAdminAuditEventsOptions): Promise<AdminAuditEventsResponse> => {
  const response = await $fetch<AdminAuditEventsApiResponse>(
    '/api/admin/audit-events',
    {
      query: {
        action: action || undefined,
        outcome: outcome || undefined,
        search: search.trim() || undefined,
        limit,
        offset
      }
    }
  )

  return {
    success: response.success,
    events: response.events.map(mapAdminAuditEvent),
    pagination: {
      ...response.pagination,
      hasMore:
        response.pagination.offset + response.events.length <
        response.pagination.total
    }
  }
}
