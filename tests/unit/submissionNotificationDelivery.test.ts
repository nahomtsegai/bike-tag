import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockSendNotificationEmail,
  mockResolveNotificationConfig,
  mockRpc,
  mockUpdate,
  mockFirstEq,
  mockSecondEq
} = vi.hoisted(() => ({
  mockSendNotificationEmail: vi.fn(),
  mockResolveNotificationConfig: vi.fn(),
  mockRpc: vi.fn(),
  mockUpdate: vi.fn(),
  mockFirstEq: vi.fn(),
  mockSecondEq: vi.fn()
}))

vi.mock('../../server/utils/submissionNotificationEmail', () => ({
  resolveSubmissionNotificationConfig: mockResolveNotificationConfig,
  sendSubmissionNotification: mockSendNotificationEmail
}))

vi.mock('../../server/utils/supabase', () => ({
  createSupabaseServerClient: () => ({
    rpc: mockRpc,
    from: () => ({
      update: mockUpdate
    })
  })
}))

import {
  sanitizeSubmissionNotificationError,
  sendTrackedSubmissionNotification
} from '../../server/utils/submissionNotificationDelivery'

type CreateErrorInput = {
  statusCode: number
  statusMessage: string
}

const createTestError = ({ statusCode, statusMessage }: CreateErrorInput) => {
  return Object.assign(new Error(statusMessage), {
    statusCode,
    statusMessage
  })
}

const payload = {
  submissionId: '11111111-1111-4111-8111-111111111111',
  riderName: 'Nahom',
  nextTitle: 'River View',
  foundLocationMapUrl: 'https://maps.google.com/?q=1,1',
  nextHiddenLocationMapUrl: 'https://maps.google.com/?q=2,2'
}

const validConfig = {
  resendApiKey: 'resend-key',
  adminNotificationEmail: 'admin@example.com',
  fromEmail: 'Bike Tag <notifications@example.com>',
  siteUrl: 'https://www.louisvillebiketag.com'
}

describe('submission notification delivery tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('createError', createTestError)
    vi.stubGlobal('useRuntimeConfig', () => ({
      resendApiKey: validConfig.resendApiKey,
      adminNotificationEmail: validConfig.adminNotificationEmail,
      fromEmail: validConfig.fromEmail,
      public: {
        siteUrl: validConfig.siteUrl
      }
    }))

    mockResolveNotificationConfig.mockReturnValue(validConfig)
    mockRpc.mockReturnValue({
      single: () => ({
        overrideTypes: () =>
          Promise.resolve({
            data: {
              id: '22222222-2222-4222-8222-222222222222',
              attempt_number: 1
            },
            error: null
          })
      })
    })
    mockSecondEq.mockResolvedValue({ error: null })
    mockFirstEq.mockReturnValue({ eq: mockSecondEq })
    mockUpdate.mockReturnValue({ eq: mockFirstEq })
    mockSendNotificationEmail.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('records a successful delivery attempt', async () => {
    await expect(sendTrackedSubmissionNotification(payload)).resolves.toEqual({
      attemptId: '22222222-2222-4222-8222-222222222222',
      attemptNumber: 1,
      status: 'sent',
      providerMessageId: null
    })

    expect(mockSendNotificationEmail).toHaveBeenCalledWith(payload)
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'sent',
        provider_message_id: null,
        error_message: null,
        completed_at: expect.any(String)
      })
    )
  })

  it('records a provider rejection and rethrows it', async () => {
    const providerError = new Error('Resend unavailable')
    mockSendNotificationEmail.mockRejectedValue(providerError)

    await expect(sendTrackedSubmissionNotification(payload)).rejects.toBe(
      providerError
    )

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        provider_message_id: null,
        error_message: 'Resend unavailable'
      })
    )
  })

  it('records missing configuration without calling the provider', async () => {
    mockResolveNotificationConfig.mockImplementation(() => {
      throw new Error('Submission notification email is not configured.')
    })

    await expect(sendTrackedSubmissionNotification(payload)).rejects.toThrow(
      'Submission notification email is not configured.'
    )

    expect(mockSendNotificationEmail).not.toHaveBeenCalled()
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        error_message: 'Submission notification email is not configured.'
      })
    )
  })

  it('redacts provider secrets and flattens multiline errors', () => {
    expect(
      sanitizeSubmissionNotificationError(
        new Error('Bearer secret-token\nkey re_123456789')
      )
    ).toBe('Bearer [redacted] key [redacted]')
  })
})
