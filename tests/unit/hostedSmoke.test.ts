import { describe, expect, it, vi } from 'vitest'
import {
  createRequester,
  createRequestHeaders,
  isRetryableStatus,
  normalizeBaseUrl,
  validateCurrentTagPayload,
  validateFoundTagsPayload
} from '../../scripts/run-hosted-smoke.mjs'

describe('hosted smoke helpers', () => {
  it('normalizes supported base URLs', () => {
    expect(normalizeBaseUrl('https://example.com/')).toBe(
      'https://example.com'
    )
    expect(normalizeBaseUrl('http://localhost:3000///')).toBe(
      'http://localhost:3000'
    )
  })

  it('rejects unsupported base URL protocols', () => {
    expect(() => normalizeBaseUrl('ftp://example.com')).toThrow(
      'Smoke base URL must use HTTP or HTTPS.'
    )
  })

  it('adds Vercel protection headers only when a secret is present', () => {
    expect(
      createRequestHeaders({
        accept: 'application/json'
      })
    ).toEqual({
      Accept: 'application/json',
      'User-Agent': 'bike-tag-hosted-smoke/1.0'
    })

    expect(
      createRequestHeaders({
        accept: 'text/html',
        bypassSecret: 'preview-secret'
      })
    ).toEqual({
      Accept: 'text/html',
      'User-Agent': 'bike-tag-hosted-smoke/1.0',
      'x-vercel-protection-bypass': 'preview-secret',
      'x-vercel-set-bypass-cookie': 'true'
    })
  })

  it('classifies transient deployment statuses separately from normal responses', () => {
    expect(isRetryableStatus(429)).toBe(true)
    expect(isRetryableStatus(503)).toBe(true)
    expect(isRetryableStatus(404)).toBe(false)
    expect(isRetryableStatus(404, [401, 403, 404])).toBe(true)
  })

  it('retries a temporary deployment response when explicitly configured', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('not ready', { status: 404 }))
      .mockResolvedValueOnce(new Response('ready', { status: 200 }))
    const delayMock = vi.fn(async () => {})
    const warnMock = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const request = createRequester({
      baseUrl: 'https://example.com',
      attempts: 3,
      retryDelayMilliseconds: 0,
      fetchImpl: fetchMock,
      delayImpl: delayMock
    })

    const response = await request('/', 'text/html', {
      retryStatuses: [404]
    })

    expect(response.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(delayMock).toHaveBeenCalledTimes(1)
    warnMock.mockRestore()
  })

  it('does not retry an expected authorization boundary by default', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('forbidden', { status: 403 })
    )
    const delayMock = vi.fn(async () => {})
    const request = createRequester({
      baseUrl: 'https://example.com',
      attempts: 3,
      retryDelayMilliseconds: 0,
      fetchImpl: fetchMock,
      delayImpl: delayMock
    })

    const response = await request(
      '/api/admin/submissions',
      'application/json'
    )

    expect(response.status).toBe(403)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(delayMock).not.toHaveBeenCalled()
  })

  it('accepts an empty current-tag state', () => {
    expect(() =>
      validateCurrentTagPayload({
        currentTag: null
      })
    ).not.toThrow()
  })

  it('accepts the public current-tag contract', () => {
    expect(() =>
      validateCurrentTagPayload({
        currentTag: {
          id: 'tag-id',
          title: 'Current tag',
          imageUrl: 'https://example.com/current.jpg',
          status: 'active',
          clueIsUnlocked: false,
          clueUnlocksAtIso: '2026-06-23T12:00:00.000Z'
        }
      })
    ).not.toThrow()
  })

  it('rejects hidden current-tag location fields', () => {
    expect(() =>
      validateCurrentTagPayload({
        currentTag: {
          id: 'tag-id',
          title: 'Current tag',
          imageUrl: 'https://example.com/current.jpg',
          status: 'active',
          clueIsUnlocked: false,
          clueUnlocksAtIso: '2026-06-23T12:00:00.000Z',
          foundLatitude: 38.25
        }
      })
    ).toThrow('Current-tag response must not expose foundLatitude.')
  })

  it('accepts the tag-history public contract', () => {
    expect(() =>
      validateFoundTagsPayload([
        {
          id: 'tag-id',
          title: 'Completed tag',
          imageUrl: 'https://example.com/completed.jpg',
          status: 'completed'
        }
      ])
    ).not.toThrow()
  })

  it('rejects a non-array tag-history payload', () => {
    expect(() => validateFoundTagsPayload({ tags: [] })).toThrow(
      'Tag-history response must be an array.'
    )
  })
})
