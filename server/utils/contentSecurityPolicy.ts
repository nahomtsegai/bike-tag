export const openStreetMapTileSource =
  'https://*.tile.openstreetmap.org'

const normalizeHttpOrigin = (value: unknown) => {
  if (typeof value !== 'string' || !value.trim()) {
    return null
  }

  try {
    const url = new URL(value.trim())

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null
    }

    return url.origin
  } catch {
    return null
  }
}

const createWebSocketOrigin = (httpOrigin: string) => {
  const url = new URL(httpOrigin)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'

  return url.origin
}

const joinSources = (sources: Array<string | null>) => {
  return [...new Set(sources.filter((source): source is string => Boolean(source)))]
    .join(' ')
}

type BuildContentSecurityPolicyOptions = {
  supabaseUrl?: unknown
}

export const buildContentSecurityPolicyReportOnly = ({
  supabaseUrl
}: BuildContentSecurityPolicyOptions = {}) => {
  const supabaseOrigin = normalizeHttpOrigin(supabaseUrl)
  const supabaseWebSocketOrigin = supabaseOrigin
    ? createWebSocketOrigin(supabaseOrigin)
    : null

  const imageSources = joinSources([
    "'self'",
    'data:',
    'blob:',
    openStreetMapTileSource,
    supabaseOrigin
  ])
  const connectionSources = joinSources([
    "'self'",
    supabaseOrigin,
    supabaseWebSocketOrigin
  ])

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "form-action 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imageSources}`,
    "font-src 'self' data:",
    `connect-src ${connectionSources}`,
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "manifest-src 'self'"
  ].join('; ')
}
