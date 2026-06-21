import {
  resolveSubmissionNotificationConfig,
  sendSubmissionNotification as sendSubmissionNotificationEmail
} from './submissionNotificationEmail'
import { createSupabaseServerClient } from './supabase'

export type SubmissionNotificationAttemptStatus = 'pending' | 'sent' | 'failed'

export type SubmissionNotificationAttemptSummary = {
  id: string
  submissionId: string
  riderName: string
  nextTitle: string
  environment: string
  status: SubmissionNotificationAttemptStatus
  attemptNumber: number
  retryOfId: string | null
  providerMessageId: string | null
  errorMessage: string | null
  startedAt: string
  completedAt: string | null
  createdAt: string
}

type NotificationAttemptRow = {
  id: string
  submission_id: string
  environment: string
  status: SubmissionNotificationAttemptStatus
  attempt_number: number
  retry_of_id: string | null
  provider_message_id: string | null
  error_message: string | null
  started_at: string
  completed_at: string | null
  created_at: string
}

type SubmissionNotificationPayloadRow = {
  id: string
  rider_name: string
  next_title: string
  found_location_map_url: string
  next_hidden_location_map_url: string
}

type SubmissionSummaryRow = {
  id: string
  rider_name: string
  next_title: string
}

type CreatedAttemptRow = {
  id: string
  attempt_number: number
}

type GlobalWithProcess = typeof globalThis & {
  process?: {
    env?: Record<string, string | undefined>
  }
}

const maxErrorMessageLength = 500

export const getSubmissionNotificationEnvironment = () => {
  const runtimeProcess = (globalThis as GlobalWithProcess).process

  return (
    runtimeProcess?.env?.VERCEL_ENV ??
    runtimeProcess?.env?.NODE_ENV ??
    'unknown'
  )
}

export const sanitizeSubmissionNotificationError = (error: unknown) => {
  const rawMessage = error instanceof Error ? error.message : String(error)

  return rawMessage
    .replace(/\bBearer\s+\S+/gi, 'Bearer [redacted]')
    .replace(/\bre_[A-Za-z0-9_-]+\b/g, '[redacted]')
    .replace(/[\r\n\t]+/g, ' ')
    .trim()
    .slice(0, maxErrorMessageLength)
}

const createNotificationError = (
  statusCode: number,
  statusMessage: string
) => {
  return createError({ statusCode, statusMessage })
}

const assertNotificationConfig = () => {
  const runtimeConfig = useRuntimeConfig()

  resolveSubmissionNotificationConfig(
    {
      resendApiKey: runtimeConfig.resendApiKey,
      adminNotificationEmail: runtimeConfig.adminNotificationEmail,
      fromEmail: runtimeConfig.fromEmail,
      siteUrl: runtimeConfig.public.siteUrl
    },
    {
      allowMissingNotificationConfig: false
    }
  )
}

const createNotificationAttempt = async ({
  submissionId,
  retryOfId = null
}: {
  submissionId: string
  retryOfId?: string | null
}) => {
  const { data, error } = await createSupabaseServerClient()
    .rpc('create_submission_notification_attempt', {
      p_submission_id: submissionId,
      p_environment: getSubmissionNotificationEnvironment(),
      p_retry_of_id: retryOfId
    })
    .single()
    .overrideTypes<CreatedAttemptRow, { merge: false }>()

  if (error || !data) {
    const message = error?.message ?? 'Could not create notification attempt.'
    const isConflict =
      message.includes('already exists') ||
      message.includes('latest failed notification attempt')

    throw createNotificationError(
      isConflict ? 409 : 500,
      isConflict ? message : `Could not create notification attempt: ${message}`
    )
  }

  return {
    id: data.id,
    attemptNumber: data.attempt_number
  }
}

const completeNotificationAttempt = async ({
  attemptId,
  status,
  providerMessageId = null,
  errorMessage = null
}: {
  attemptId: string
  status: Exclude<SubmissionNotificationAttemptStatus, 'pending'>
  providerMessageId?: string | null
  errorMessage?: string | null
}) => {
  const { error } = await createSupabaseServerClient()
    .from('submission_notification_attempts')
    .update({
      status,
      provider_message_id: providerMessageId,
      error_message: errorMessage,
      completed_at: new Date().toISOString()
    })
    .eq('id', attemptId)
    .eq('status', 'pending')

  if (error) {
    throw createNotificationError(
      500,
      `Could not complete notification attempt: ${error.message}`
    )
  }
}

export const sendTrackedSubmissionNotification = async ({
  submissionId,
  riderName,
  nextTitle,
  foundLocationMapUrl,
  nextHiddenLocationMapUrl,
  retryOfId = null
}: {
  submissionId: string
  riderName: string
  nextTitle: string
  foundLocationMapUrl: string
  nextHiddenLocationMapUrl: string
  retryOfId?: string | null
}) => {
  const attempt = await createNotificationAttempt({ submissionId, retryOfId })

  try {
    assertNotificationConfig()

    await sendSubmissionNotificationEmail({
      submissionId,
      riderName,
      nextTitle,
      foundLocationMapUrl,
      nextHiddenLocationMapUrl
    })

    await completeNotificationAttempt({
      attemptId: attempt.id,
      status: 'sent'
    })

    return {
      attemptId: attempt.id,
      attemptNumber: attempt.attemptNumber,
      status: 'sent' as const,
      providerMessageId: null
    }
  } catch (error) {
    try {
      await completeNotificationAttempt({
        attemptId: attempt.id,
        status: 'failed',
        errorMessage: sanitizeSubmissionNotificationError(error)
      })
    } catch (trackingError) {
      console.error(
        '[submission-notification] Could not record failed delivery.',
        trackingError
      )
    }

    throw error
  }
}

const fetchNotificationAttemptById = async (attemptId: string) => {
  const { data, error } = await createSupabaseServerClient()
    .from('submission_notification_attempts')
    .select(
      'id,submission_id,environment,status,attempt_number,retry_of_id,provider_message_id,error_message,started_at,completed_at,created_at'
    )
    .eq('id', attemptId)
    .maybeSingle()
    .overrideTypes<NotificationAttemptRow, { merge: false }>()

  if (error) {
    throw createNotificationError(
      500,
      `Could not load notification attempt: ${error.message}`
    )
  }

  if (!data) {
    throw createNotificationError(404, 'Notification attempt was not found.')
  }

  return data
}

const fetchSubmissionNotificationPayload = async (submissionId: string) => {
  const { data, error } = await createSupabaseServerClient()
    .from('submissions')
    .select(
      'id,rider_name,next_title,found_location_map_url,next_hidden_location_map_url'
    )
    .eq('id', submissionId)
    .maybeSingle()
    .overrideTypes<SubmissionNotificationPayloadRow, { merge: false }>()

  if (error) {
    throw createNotificationError(
      500,
      `Could not load submission for notification retry: ${error.message}`
    )
  }

  if (!data) {
    throw createNotificationError(404, 'Submission was not found.')
  }

  return data
}

export const retryFailedSubmissionNotification = async (attemptId: string) => {
  const attempt = await fetchNotificationAttemptById(attemptId)

  if (attempt.status !== 'failed') {
    throw createNotificationError(
      409,
      'Only failed notification attempts can be retried.'
    )
  }

  const submission = await fetchSubmissionNotificationPayload(
    attempt.submission_id
  )

  return await sendTrackedSubmissionNotification({
    submissionId: submission.id,
    riderName: submission.rider_name,
    nextTitle: submission.next_title,
    foundLocationMapUrl: submission.found_location_map_url,
    nextHiddenLocationMapUrl: submission.next_hidden_location_map_url,
    retryOfId: attempt.id
  })
}

export const getRecentSubmissionNotificationAttempts = async ({
  limit = 50,
  status,
  environment = getSubmissionNotificationEnvironment()
}: {
  limit?: number
  status?: SubmissionNotificationAttemptStatus
  environment?: string
} = {}) => {
  const safeLimit = Math.min(100, Math.max(1, Math.trunc(limit)))
  const supabase = createSupabaseServerClient()
  let query = supabase
    .from('submission_notification_attempts')
    .select(
      'id,submission_id,environment,status,attempt_number,retry_of_id,provider_message_id,error_message,started_at,completed_at,created_at'
    )
    .eq('environment', environment)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(safeLimit)
    .overrideTypes<NotificationAttemptRow[], { merge: false }>()

  if (error) {
    throw createNotificationError(
      500,
      `Could not load notification delivery history: ${error.message}`
    )
  }

  const attempts = data ?? []
  const submissionIds = [...new Set(attempts.map((attempt) => attempt.submission_id))]
  const submissionMap = new Map<string, SubmissionSummaryRow>()

  if (submissionIds.length > 0) {
    const { data: submissions, error: submissionError } =
      await createSupabaseServerClient()
        .from('submissions')
        .select('id,rider_name,next_title')
        .in('id', submissionIds)
        .overrideTypes<SubmissionSummaryRow[], { merge: false }>()

    if (submissionError) {
      throw createNotificationError(
        500,
        `Could not load notification submission summaries: ${submissionError.message}`
      )
    }

    for (const submission of submissions ?? []) {
      submissionMap.set(submission.id, submission)
    }
  }

  return attempts.map((attempt): SubmissionNotificationAttemptSummary => {
    const submission = submissionMap.get(attempt.submission_id)

    return {
      id: attempt.id,
      submissionId: attempt.submission_id,
      riderName: submission?.rider_name ?? 'Unknown rider',
      nextTitle: submission?.next_title ?? 'Unknown tag',
      environment: attempt.environment,
      status: attempt.status,
      attemptNumber: attempt.attempt_number,
      retryOfId: attempt.retry_of_id,
      providerMessageId: attempt.provider_message_id,
      errorMessage: attempt.error_message,
      startedAt: attempt.started_at,
      completedAt: attempt.completed_at,
      createdAt: attempt.created_at
    }
  })
}
