import { createSupabaseServerClient } from './supabase'

type SubmitDiagnosticMetadata = Record<string, unknown> | null

type AdminSubmitErrorRow = {
  id: string
  event_name: string
  step: string | null
  message: string | null
  session_id: string | null
  metadata: SubmitDiagnosticMetadata
  user_agent: string | null
  created_at: string
}

type FetchAdminSubmitErrorsOptions = {
  filter?: AdminSubmitErrorFilter
  limit: number
  offset: number
}

export type AdminSubmitErrorFilter =
  | 'all'
  | 'failures'
  | 'payload'
  | 'compression'
  | 'api'

const submitErrorSelectColumns = [
  'id',
  'event_name',
  'step',
  'message',
  'session_id',
  'metadata',
  'user_agent',
  'created_at'
].join(', ')

const createAdminSubmitErrorsError = (message: string) => {
  return createError({
    statusCode: 500,
    statusMessage: message
  })
}

const mapAdminSubmitError = (event: AdminSubmitErrorRow) => {
  return {
    id: event.id,
    eventName: event.event_name,
    step: event.step,
    message: event.message,
    sessionId: event.session_id,
    metadata: event.metadata,
    userAgent: event.user_agent,
    createdAt: event.created_at
  }
}

export const isAdminSubmitErrorFilter = (
  value: unknown
): value is AdminSubmitErrorFilter => {
  return value === 'all' ||
    value === 'failures' ||
    value === 'payload' ||
    value === 'compression' ||
    value === 'api'
}

export const fetchAdminSubmitErrorsFromSupabase = async ({
  filter = 'all',
  limit,
  offset
}: FetchAdminSubmitErrorsOptions) => {
  const supabase = createSupabaseServerClient()
  const from = offset
  const to = offset + limit - 1

  let query = supabase
    .from('submit_diagnostic_events')
    .select(submitErrorSelectColumns, { count: 'exact' })

  if (filter === 'failures') {
    query = query.or(
      [
        'event_name.ilike.%failed%',
        'event_name.ilike.%error%',
        'message.ilike.%failed%',
        'message.ilike.%error%'
      ].join(',')
    )
  }

  if (filter === 'payload') {
    query = query.or(
      [
        'message.ilike.%413%',
        'message.ilike.%payload%',
        'message.ilike.%FUNCTION_PAYLOAD_TOO_LARGE%',
        'metadata->>errorStatusCode.eq.413',
        'metadata->>errorData.ilike.%FUNCTION_PAYLOAD_TOO_LARGE%'
      ].join(',')
    )
  }

  if (filter === 'compression') {
    query = query.or(
      [
        'event_name.eq.submit_photos_prepared',
        'event_name.ilike.%compress%'
      ].join(',')
    )
  }

  if (filter === 'api') {
    query = query.ilike('event_name', 'api_%')
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)
    .overrideTypes<AdminSubmitErrorRow[], { merge: false }>()

  if (error) {
    throw createAdminSubmitErrorsError(
      `Could not load admin submit errors from Supabase: ${error.message}`
    )
  }

  return {
    events: (data ?? []).map(mapAdminSubmitError),
    pagination: {
      limit,
      offset,
      count: count ?? 0,
      hasMore: offset + limit < (count ?? 0)
    }
  }
}