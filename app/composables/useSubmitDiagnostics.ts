type SubmitDiagnosticMetadata = Record<string, unknown>

type TrackSubmitEventInput = {
  eventName: string
  step?: string
  message?: string
  metadata?: SubmitDiagnosticMetadata
}

const submitDiagnosticsSessionStorageKey = 'bike-tag-submit-diagnostics-session-id'

const createSubmitDiagnosticsSessionId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const getSubmitDiagnosticsSessionId = () => {
  if (!import.meta.client) {
    return createSubmitDiagnosticsSessionId()
  }

  const existingSessionId = sessionStorage.getItem(
    submitDiagnosticsSessionStorageKey
  )

  if (existingSessionId) {
    return existingSessionId
  }

  const sessionId = createSubmitDiagnosticsSessionId()

  sessionStorage.setItem(submitDiagnosticsSessionStorageKey, sessionId)

  return sessionId
}

export const useSubmitDiagnostics = () => {
  const sessionId = getSubmitDiagnosticsSessionId()

  const trackSubmitEvent = async ({
    eventName,
    step,
    message,
    metadata = {}
  }: TrackSubmitEventInput) => {
    if (!import.meta.client) {
      return
    }

    try {
      await $fetch('/api/submit-diagnostics', {
        method: 'POST',
        body: {
          sessionId,
          eventName,
          step,
          message,
          metadata,
          userAgent: navigator.userAgent,
          screenWidth: window.screen.width,
          screenHeight: window.screen.height
        }
      })
    } catch (error) {
      console.warn('Submit diagnostic event failed.', error)
    }
  }

  return {
    submitDiagnosticsSessionId: sessionId,
    trackSubmitEvent
  }
}