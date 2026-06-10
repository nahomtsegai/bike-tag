import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getTagDataSource,
  resolveTagDataSource
} from '../../server/utils/tagDataSource'

type CreateErrorInput = {
  statusCode: number
  statusMessage: string
}

const configurationErrorMessage =
  'Tag data source must be configured as "supabase" outside development.'

const createTestError = ({ statusCode, statusMessage }: CreateErrorInput) => {
  const error = new Error(statusMessage) as Error & CreateErrorInput

  error.statusCode = statusCode
  error.statusMessage = statusMessage

  return error
}

const stubRuntimeConfig = (tagDataSource: unknown) => {
  vi.stubGlobal('useRuntimeConfig', () => {
    return {
      tagDataSource
    }
  })
}

describe('tagDataSource', () => {
  beforeEach(() => {
    vi.stubGlobal('createError', createTestError)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('resolveTagDataSource', () => {
    it('returns supabase when mock data is not allowed', () => {
      expect(
        resolveTagDataSource('supabase', {
          allowMockDataSource: false
        })
      ).toBe('supabase')
    })

    it('rejects mock when mock data is not allowed', () => {
      expect(() =>
        resolveTagDataSource('mock', {
          allowMockDataSource: false
        })
      ).toThrow(configurationErrorMessage)
    })

    it('rejects a missing data source when mock data is not allowed', () => {
      expect(() =>
        resolveTagDataSource('', {
          allowMockDataSource: false
        })
      ).toThrow(configurationErrorMessage)
    })

    it('allows mock when mock data is allowed', () => {
      expect(
        resolveTagDataSource('mock', {
          allowMockDataSource: true
        })
      ).toBe('mock')
    })

    it('defaults to mock when the data source is missing and mock data is allowed', () => {
      expect(
        resolveTagDataSource('', {
          allowMockDataSource: true
        })
      ).toBe('mock')
    })

    it('rejects invalid data source values even when mock data is allowed', () => {
      expect(() =>
        resolveTagDataSource('postgres', {
          allowMockDataSource: true
        })
      ).toThrow(configurationErrorMessage)
    })
  })

  describe('getTagDataSource', () => {
    it('returns the configured runtime data source', () => {
      stubRuntimeConfig('supabase')

      expect(getTagDataSource()).toBe('supabase')
    })
  })
})