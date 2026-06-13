const contentSecurityPolicyReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' ws: wss:",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "manifest-src 'self'"
].join('; ')

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=(self)',
    'payment=()'
  ].join(', '),
  'Cross-Origin-Opener-Policy': 'same-origin',
  'X-XSS-Protection': '0',
  'Content-Security-Policy-Report-Only':
    contentSecurityPolicyReportOnly
}

export default defineEventHandler((event) => {
  for (const [headerName, headerValue] of Object.entries(securityHeaders)) {
    setHeader(event, headerName, headerValue)
  }

  if (!import.meta.dev) {
    setHeader(
      event,
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    )
  }
})