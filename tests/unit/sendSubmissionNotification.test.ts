import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveSubmissionNotificationConfig } from '../../server/utils/sendSubmissionNotification'

type CreateErrorInput = {
  statusCode: number
  statusMessage: string
}

const notificationConfigErrorMessage =
  'Submission notification email is not configured.'

const createTestError = ({ statusCode, statusMessage }: CreateErrorInput) => {
  const error = new Error(statusMessage) as Error & CreateErrorInput

  error.statusCode = statusCode
  error.statusMessage = statusMessage

  return error
}

const validNotificationConfig = {
  resendApiKey: 'resend-api-key',
  adminNotificationEmail: 'admin@example.com',
  fromEmail: 'Bike Tag <onboarding@resend.dev>',
  siteUrl: 'https://example.com'
}

describe('sendSubmissionNotification', () => {
  beforeEach(() => {
    vi.stubGlobal('createError', createTestError)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('resolveSubmissionNotificationConfig', () => {
    it('returns notification config when all values are present', () => {
      expect(
        resolveSubmissionNotificationConfig(validNotificationConfig, {
          allowMissingNotificationConfig: false
        })
      ).toEqual(validNotificationConfig)
    })

    it('trims notification config values', () => {
      expect(
        resolveSubmissionNotificationConfig(
          {
            resendApiKey: ' resend-api-key ',
            adminNotificationEmail: ' admin@example.com ',
            fromEmail: ' Bike Tag <onboarding@resend.dev> ',
            siteUrl: ' https://example.com '
          },
          {
            allowMissingNotificationConfig: false
          }
        )
      ).toEqual(validNotificationConfig)
    })

    it('returns null for missing config when missing notification config is allowed', () => {
      expect(
        resolveSubmissionNotificationConfig(
          {
            ...validNotificationConfig,
            resendApiKey: ''
          },
          {
            allowMissingNotificationConfig: true
          }
        )
      ).toBeNull()
    })

    it('throws for missing config when missing notification config is not allowed', () => {
      expect(() =>
        resolveSubmissionNotificationConfig(
          {
            ...validNotificationConfig,
            resendApiKey: ''
          },
          {
            allowMissingNotificationConfig: false
          }
        )
      ).toThrow(notificationConfigErrorMessage)
    })

    it('throws for whitespace-only config values when missing notification config is not allowed', () => {
      expect(() =>
        resolveSubmissionNotificationConfig(
          {
            ...validNotificationConfig,
            siteUrl: '   '
          },
          {
            allowMissingNotificationConfig: false
          }
        )
      ).toThrow(notificationConfigErrorMessage)
    })
  })
})