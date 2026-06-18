import { createError } from 'h3'

import type {
  AdminAuditAction,
  AdminAuditEvent,
  AdminAuditOutcome
} from './adminAudit'
import { createSupabaseServerClient } from './supabase'

export type AdminAuditHistoryFilters = {
  action?: AdminAuditAction
  outcome?: AdminAuditOutcome
  search?: string
  limit: number
  offset: number
}

export const fetchAdminAuditHistoryFromSupabase = async ({
  action,
  outcome,
  search,
  limit,
  offset
}: AdminAuditHistoryFilters) => {
  const supabase = createSupabaseServerClient()
  let query = supabase
    .from('admin_audit_events')
    .select(
      'id,action,outcome,actor_admin_user_id,actor_auth_user_id,actor_email,target_type,target_id,request_id,metadata,error_code,error_message,created_at,completed_at',
      {
        count: 'exact'
      }
    )
    .order('created_at', {
      ascending: false
    })

  if (action) {
    query = query.eq('action', action)
  }

  if (outcome) {
    query = query.eq('outcome', outcome)
  }

  if (search) {
    const searchPattern = `%${search}%`

    query = query.or(
      [
        `actor_email.ilike.${searchPattern}`,
        `target_id.ilike.${searchPattern}`,
        `request_id.ilike.${searchPattern}`
      ].join(',')
    )
  }

  const { data, count, error } = await query.range(
    offset,
    offset + limit - 1
  )

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Could not load admin audit events: ${error.message}`
    })
  }

  if (!Array.isArray(data)) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Admin audit events returned an unexpected response.'
    })
  }

  return {
    events: data as AdminAuditEvent[],
    pagination: {
      limit,
      offset,
      total: count ?? data.length
    }
  }
}
