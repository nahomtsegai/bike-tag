import { describe, expect, it, vi } from 'vitest'
import {
  getAdminApiErrorMessage,
  isAdminApiError
} from '../../app/utils/adminApiErrors'

describe('adminApiErrors', () => {
  describe('isAdminApiError', () => {
    it('returns true for object errors', () => {
      expect(isAdminApiError({ statusCode: 400 })).toBe(true)
      expect(isAdminApiError(new Error('Failed'))).toBe(true)
    })

    it('returns false for null and non object values', () => {
      expect(isAdminApiError(null)).toBe(false)
      expect(isAdminApiError(undefined)).toBe(false)
      expect(isAdminApiError('error')).toBe(false)
    })
  })

  describe('getAdminApiErrorMessage', () => {
    it('returns the session expired message and calls auth failure callback for 403 errors', () => {
      const onAuthFailure = vi.fn()

      const message = getAdminApiErrorMessage(
        {
          statusCode: 403,
          statusMessage: 'Forbidden'
        },
        {
          onAuthFailure
        }
      )

      expect(message).toBe(
        'Your admin session expired. Please log in again.'
      )
      expect(onAuthFailure).toHaveBeenCalledTimes(1)
    })

    it('returns statusMessage for 400 errors when available', () => {
      expect(
        getAdminApiErrorMessage({
          statusCode: 400,
          statusMessage: 'Status filter is invalid.'
        })
      ).toBe('Status filter is invalid.')
    })

    it('returns message for 400 errors when statusMessage is missing', () => {
      expect(
        getAdminApiErrorMessage({
          statusCode: 400,
          message: 'Bad request.'
        })
      ).toBe('Bad request.')
    })

    it('returns the fallback validation message for 400 errors without messages', () => {
      expect(
        getAdminApiErrorMessage({
          statusCode: 400
        })
      ).toBe('The request is invalid. Check your filters and try again.')
    })

    it('returns statusMessage for known API errors', () => {
      expect(
        getAdminApiErrorMessage({
          statusCode: 500,
          statusMessage: 'Server exploded softly.'
        })
      ).toBe('Server exploded softly.')
    })

    it('returns native Error messages', () => {
      expect(getAdminApiErrorMessage(new Error('Network failed.'))).toBe(
        'Network failed.'
      )
    })

    it('returns a fallback message for unknown errors', () => {
      expect(getAdminApiErrorMessage('unknown')).toBe(
        'Could not load submissions.'
      )
    })
  })
})