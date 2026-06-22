import {
  createClientRuntimeErrorReport,
  getClientRuntimeErrorSignature,
  shouldReportClientRuntimeError,
  type ClientRuntimeErrorSource
} from '~/utils/runtimeErrorMonitoring'

const duplicateWindowMs = 5_000
const recentReports = new Map<string, number>()

const pruneRecentReports = (now: number) => {
  for (const [signature, reportedAt] of recentReports.entries()) {
    if (now - reportedAt > duplicateWindowMs) {
      recentReports.delete(signature)
    }
  }
}

const sendRuntimeErrorReport = (
  error: unknown,
  source: ClientRuntimeErrorSource,
  context?: string | null
) => {
  if (!shouldReportClientRuntimeError(error)) {
    return
  }

  const report = createClientRuntimeErrorReport(error, source, {
    routePath: window.location.pathname,
    context,
    screenWidth: window.screen?.width ?? null,
    screenHeight: window.screen?.height ?? null
  })
  const now = Date.now()
  const signature = getClientRuntimeErrorSignature(report)

  pruneRecentReports(now)

  if (recentReports.has(signature)) {
    return
  }

  recentReports.set(signature, now)

  void fetch('/api/runtime-errors', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(report),
    keepalive: true
  }).catch(() => {
    // Runtime monitoring must never create another user-facing error.
  })
}

export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.dev) {
    return
  }

  nuxtApp.hook('vue:error', (error, _instance, info) => {
    sendRuntimeErrorReport(error, 'client-vue', info)
  })

  nuxtApp.hook('app:error', (error) => {
    sendRuntimeErrorReport(error, 'client-app')
  })

  window.addEventListener('error', (event) => {
    sendRuntimeErrorReport(
      event.error || new Error(event.message),
      'client-window',
      event.filename || null
    )
  })

  window.addEventListener('unhandledrejection', (event) => {
    sendRuntimeErrorReport(event.reason, 'client-promise')
  })
})
