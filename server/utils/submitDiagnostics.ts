import { createSupabaseServerClient } from './supabase'

export type SubmitDiagnosticMetadata = Record<string, unknown>

type LogSubmitDiagnosticEventInput = {
  sessionId: string
  eventName: string
  step?: string | null
  message?: string | null
  metadata?: SubmitDiagnosticMetadata
  userAgent?: string | null
  screenWidth?: number | null
  screenHeight?: number | null
}

export const logSubmitDiagnosticEvent = async ({
  sessionId,
  eventName,
  step = null,
  message = null,
  metadata = {},
  userAgent = null,
  screenWidth = null,
  screenHeight = null
}: LogSubmitDiagnosticEventInput) => {
  const supabase = createSupabaseServerClient()

  const { error } = await supabase
    .from('submit_diagnostic_events')
    .insert({
      session_id: sessionId,
      event_name: eventName,
      step,
      message,
      metadata,
      user_agent: userAgent,
      screen_width: screenWidth,
      screen_height: screenHeight
    })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Could not save submit diagnostic event: ${error.message}`
    })
  }
}

export const safelyLogSubmitDiagnosticEvent = async (
  input: LogSubmitDiagnosticEventInput
) => {
  try {
    await logSubmitDiagnosticEvent(input)
  } catch (error) {
    console.error('Submit diagnostic event failed.', error)
  }
}