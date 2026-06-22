import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createSentryEnvelope,
  parseSentryDsn,
  reportRuntimeError,
  sanitizeRuntimeErrorPath,
  shouldReportRuntimeError
} from '../../server/utils/runtimeErrorMonitoring'

const fetchMock = vi.fn()
const exampleDsn = 'https://exampleKey@errors.invalid/42'

beforeEach(() => {
  fetchMock.mockReset()
  fetchMock.mockResolvedValue({ ok: true, status: 200 })

  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('useRuntimeConfig', () => ({
    sentryDsn: '',
    sentryEnvironment: '',
    sentryRelease: ''
  }))

  delete process.env.SENTRY_DSN
  delete process.env.SENTRY_ENVIRONMENT
  delete process.env.SENTRY_RELEASE
  delete process.env.VERCEL_ENV
  delete process.env.VERCEL_GIT_COMMIT_SHA
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('runtime error monitoring', () => {
  it('builds a Sentry envelope endpoint from a DSN', () => {
    expect(parseSentryDsn(exampleDsn)).toEqual({
      endpoint:
        'https://errors.invalid/api/42/envelope/?sentry_version=7&sentry_key=exampleKey&sentry_client=bike-tag-runtime%2F1.0',
      dsn: exampleDsn
    })

    expect(parseSentryDsn('not-a-dsn')).toBeNull()
  })

  it('removes query strings and fragments from captured paths', () => {
    expect(sanitizeRuntimeErrorPath('/submit?view=details#review')).toBe(
      '/submit'
    )
    expect(sanitizeRuntimeErrorPath('admin/activity?search=user')).toBe(
      '/admin/activity'
    )
  })

  it('ignores expected client and HTTP errors', () => {
    expect(
      shouldReportRuntimeError(
        Object.assign(new Error('Invalid form'), { statusCode: 400 })
      )
    ).toBe(false)
    expect(
      shouldReportRuntimeError(Object.assign(new Error('Cancelled'), {
        name: 'AbortError'
      }))
    ).toBe(false)
    expect(shouldReportRuntimeError(new Error('Database unavailable'))).toBe(
      true
    )
  })

  it('creates an envelope with bounded operational context', () => {
    const envelope = createSentryEnvelope(
      {
        source: 'nitro',
        name: 'DatabaseError',
        message: 'Database unavailable',
        stack: 'DatabaseError: Database unavailable\n at query',
        routePath: '/api/tags/submit?view=details',
        method: 'POST',
        statusCode: 500,
        requestId: 'request-123',
        userAgent: 'test-agent'
      },
      {
        dsn: exampleDsn,
        environment: 'preview',
        release: 'commit-sha'
      },
      '0123456789abcdef0123456789abcdef'
    )

    expect(envelope).toContain('"environment":"preview"')
    expect(envelope).toContain('"release":"commit-sha"')
    expect(envelope).toContain('"request_id":"request-123"')
    expect(envelope).toContain('"url":"/api/tags/submit"')
    expect(envelope).not.toContain('view=details')
  })

  it('does not send when no DSN is configured', async () => {
    await expect(
      reportRuntimeError({
        source: 'nitro',
        name: 'Error',
        message: 'No provider configured'
      })
    ).resolves.toEqual({
      reported: false,
      eventId: null
    })

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends configured errors through the envelope endpoint', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      sentryDsn: exampleDsn,
      sentryEnvironment: 'production',
      sentryRelease: 'release-sha'
    }))

    const result = await reportRuntimeError({
      source: 'nitro',
      name: 'Error',
      message: 'Unexpected failure',
      routePath: '/api/tags/current',
      method: 'GET',
      statusCode: 500,
      requestId: 'request-456'
    })

    expect(result.reported).toBe(true)
    expect(result.eventId).toMatch(/^[a-f0-9]{32}$/)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/42/envelope/'),
      expect.objectContaining({
        method: 'POST',
        headers: {
          'content-type': 'application/x-sentry-envelope'
        },
        body: expect.stringContaining('Unexpected failure')
      })
    )
  })
})
