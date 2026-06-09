export type AdminSubmitErrorFilter =
  | 'all'
  | 'failures'
  | 'payload'
  | 'compression'
  | 'api'

export type AdminSubmitErrorEvent = {
  id: string
  eventName: string
  step: string | null
  message: string | null
  sessionId: string | null
  metadata: Record<string, unknown> | null
  userAgent: string | null
  createdAt: string
}

export type AdminSubmitErrorsPagination = {
  limit: number
  offset: number
  count: number
  hasMore: boolean
}

export type AdminSubmitErrorsResponse = {
  success: boolean
  events: AdminSubmitErrorEvent[]
  pagination: AdminSubmitErrorsPagination
}