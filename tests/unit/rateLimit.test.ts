import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  assertRateLimit,
  clearRateLimitStore,
  getPositiveNumberConfig
} from '../../server/utils/rateLimit'

type CreateErrorInput = {
  statusCode: number
  statusMessage: string
}

const createTestError = ({ statusCode, statusMessage }: CreateErrorInput) => {
  const error = new Error(statusMessage) as Error & CreateErrorInput

  error.statusCode = statusCode
  error.statusMessage = statusMessage

  return error
}

describe('rateLimit', () => {
  beforeEach(() => {
    clearRateLimitStore()
    vi.stubGlobal('createError', createTestError)
  })

  afterEach(() => {
    clearRateLimitStore()
    vi.unstubAllGlobals()
  })

  describe('getPositiveNumberConfig', () => {
    it('returns the configured positive number', () => {
      expect(getPositiveNumberConfig('12', 5)).toBe(12)
      expect(getPositiveNumberConfig(8, 5)).toBe(8)
    })

    it('returns the fallback for invalid values', () => {
      expect(getPositiveNumberConfig('', 5)).toBe(5)
      expect(getPositiveNumberConfig(0, 5)).toBe(5)
      expect(getPositiveNumberConfig(-1, 5)).toBe(5)
      expect(getPositiveNumberConfig('nope', 5)).toBe(5)
    })
  })

  describe('assertRateLimit', () => {
    it('allows requests under the configured limit', () => {
      expect(() => {
        assertRateLimit({
          key: 'submit-diagnostics:test-ip',
          limit: 2,
          windowMs: 60_000,
          messagePrefix: 'Too many diagnostic events.'
        })

        assertRateLimit({
          key: 'submit-diagnostics:test-ip',
          limit: 2,
          windowMs: 60_000,
          messagePrefix: 'Too many diagnostic events.'
        })
      }).not.toThrow()
    })

    it('throws a 429 error when the configured limit is exceeded', () => {
      assertRateLimit({
        key: 'admin-login:test-ip',
        limit: 1,
        windowMs: 60_000,
        messagePrefix: 'Too many admin login attempts.'
      })

      expect(() => {
        assertRateLimit({
          key: 'admin-login:test-ip',
          limit: 1,
          windowMs: 60_000,
          messagePrefix: 'Too many admin login attempts.'
        })
      }).toThrow('Too many admin login attempts. Try again in')
    })
  })
})