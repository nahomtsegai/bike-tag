import { createError, getHeader, type H3Event } from 'h3'

import { createSupabaseServerClient } from './supabase'

export type AdminAuditAction =
  | 'admin.login'
  | 'submission.approve'
  | 'submission.reject'
  | 'submission.archive'
  | 'submission.delete'
  | 'notification.retry'
  | 'tag.opening.create'
  | 'game_data.delete'

export type AdminAuditOutcome = 'started' | 'succeeded' | 'failed'

export type AdminAuditActor = {
  id: string
  user_id: string
  email: string
}

export type AdminAuditMetadata = Record<
  string,
  string | number | boolean | null | undefined
>

export type AdminAuditEvent = {
  id: string
  action: AdminAuditAction
  outcome: AdminAuditOutcome
  actor_admin_user_id: string | null
  actor_auth_user_id: string | null
  actor_email: string | null
  target_type: string | null
  target_id: string | null
  request_id: string
  metadata: Record<string, unknown>
  error_code: string | null
  error_message: string | null
  created_at: string
  completed_at: string | null
}

type AuditCompletionDetails = {
  actor?: AdminAuditActor
  actorEmail?: string
  targetType?: string
  targetId?: string
  metadata?: AdminAuditMetadata
}

type RunAdminAuditedActionOptions<Result> = {
  event: H3Event
  action: AdminAuditAction
  actor?: AdminAuditActor
  actorEmail?: string
  targetType?: string
  targetId?: string
  metadata?: AdminAuditMetadata
  execute: () => Promise<Result>
  onSuccess?: (result: Result) => AuditCompletionDetails
}

type AuditErrorDetails = {
  errorCode: string | null
  errorMessage: string
}

const maxAuditErrorMessageLength = 500

const getRequestId = (event: H3Event) => {
  const requestId = getHeader(event, 'x-request-id')?.trim()

  if (requestId) {
    return requestId
  }

  const vercelRequestId = getHeader(event, 'x-vercel-id')?.trim()

  if (vercelRequestId) {
    return vercelRequestId
  }

  return globalThis.crypto.randomUUID()
}

const removeUndefinedMetadataValues = (metadata: AdminAuditMetadata = {}) => {
  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => value !== undefined)
  )
}

const getAuditErrorDetails = (error: unknown): AuditErrorDetails => {
  if (typeof error !== 'object' || error === null) {
    return {
      errorCode: null,
      errorMessage: String(error).slice(0, maxAuditErrorMessageLength)
    }
  }

  const errorRecord = error as Record<string, unknown>
  const statusCode = errorRecord.statusCode
  const errorCode =
    typeof statusCode === 'number' || typeof statusCode === 'string'
      ? String(statusCode)
      : null
  const statusMessage = errorRecord.statusMessage
  const message = errorRecord.message
  const errorMessage =
    typeof statusMessage === 'string'
      ? statusMessage
      : typeof message === 'string'
        ? message
        : 'Unknown admin action error.'

  return {
    errorCode,
    errorMessage: errorMessage.slice(0, maxAuditErrorMessageLength)
  }
}

const createAdminAuditEvent = async ({
  event,
  action,
  actor,
  actorEmail,
  targetType,
  targetId,
  metadata
}: Omit<RunAdminAuditedActionOptions<unknown>, 'execute' | 'onSuccess'>) => {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from('admin_audit_events')
    .insert({
      action,
      outcome: 'started',
      actor_admin_user_id: actor?.id ?? null,
      actor_auth_user_id: actor?.user_id ?? null,
      actor_email: actor?.email ?? actorEmail ?? null,
      target_type: targetType ?? null,
      target_id: targetId ?? null,
      request_id: getRequestId(event),
      metadata: removeUndefinedMetadataValues(metadata)
    })
    .select('id')
    .single<{ id: string }>()

  if (error || !data?.id) {
    console.error('[admin-audit] Could not create audit event.', {
      action,
      targetType,
      targetId,
      error
    })

    throw createError({
      statusCode: 503,
      statusMessage: 'Admin audit logging is temporarily unavailable.'
    })
  }

  return data.id
}

const completeAdminAuditEvent = async ({
  auditEventId,
  outcome,
  actor,
  actorEmail,
  targetType,
  targetId,
  metadata,
  errorDetails
}: AuditCompletionDetails & {
  auditEventId: string
  outcome: 'succeeded' | 'failed'
  errorDetails?: AuditErrorDetails
}) => {
  const supabase = createSupabaseServerClient()
  const { error } = await supabase
    .from('admin_audit_events')
    .update({
      outcome,
      actor_admin_user_id: actor?.id,
      actor_auth_user_id: actor?.user_id,
      actor_email: actor?.email ?? actorEmail,
      target_type: targetType,
      target_id: targetId,
      metadata: metadata
        ? removeUndefinedMetadataValues(metadata)
        : undefined,
      error_code: errorDetails?.errorCode ?? null,
      error_message: errorDetails?.errorMessage ?? null,
      completed_at: new Date().toISOString()
    })
    .eq('id', auditEventId)

  if (error) {
    console.error('[admin-audit] Could not complete audit event.', {
      auditEventId,
      outcome,
      error
    })
  }
}

export const runAdminAuditedAction = async <Result>({
  event,
  action,
  actor,
  actorEmail,
  targetType,
  targetId,
  metadata,
  execute,
  onSuccess
}: RunAdminAuditedActionOptions<Result>) => {
  const auditEventId = await createAdminAuditEvent({
    event,
    action,
    actor,
    actorEmail,
    targetType,
    targetId,
    metadata
  })

  try {
    const result = await execute()
    let successDetails: AuditCompletionDetails = {}

    if (onSuccess) {
      try {
        successDetails = onSuccess(result)
      } catch (error) {
        console.error('[admin-audit] Could not derive audit success details.', {
          auditEventId,
          action,
          error
        })
      }
    }

    await completeAdminAuditEvent({
      auditEventId,
      outcome: 'succeeded',
      actor: successDetails.actor ?? actor,
      actorEmail: successDetails.actorEmail ?? actorEmail,
      targetType: successDetails.targetType ?? targetType,
      targetId: successDetails.targetId ?? targetId,
      metadata: successDetails.metadata ?? metadata
    })

    return result
  } catch (error) {
    await completeAdminAuditEvent({
      auditEventId,
      outcome: 'failed',
      actor,
      actorEmail,
      targetType,
      targetId,
      metadata,
      errorDetails: getAuditErrorDetails(error)
    })

    throw error
  }
}

export const fetchAdminAuditEventsFromSupabase = async ({
  limit,
  offset
}: {
  limit: number
  offset: number
}) => {
  const supabase = createSupabaseServerClient()
  const { data, count, error } = await supabase
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
    .range(offset, offset + limit - 1)

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
