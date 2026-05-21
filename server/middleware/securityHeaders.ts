const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()'
  ].join(', '),
  'Cross-Origin-Opener-Policy': 'same-origin',
  'X-XSS-Protection': '0'
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