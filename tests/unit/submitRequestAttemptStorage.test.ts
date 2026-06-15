import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearSubmitRequestAttempt,
  createSubmitRequestPayloadFingerprint,
  isSubmitRequestAttempt,
  loadSubmitRequestAttempt,
  resolveSubmitRequestAttempt,
  saveSubmitRequestAttempt,
  type SubmitRequestAttempt,
  type SubmitRequestPayloadFingerprintInput
} from '../../app/utils/submitRequestAttemptStorage'

const storage = new Map<string, string>()

const sessionStorageMock = {
  getItem: vi.fn((key: string) => {
    return storage.get(key) ?? null
  }),
  setItem: vi.fn((key: string, value: string) => {
    storage.set(key, value)
  }),
  removeItem: vi.fn((key: string) => {
    storage.delete(key)
  }),
  clear: vi.fn(() => {
    storage.clear()
  })
}

const createPayload = (): SubmitRequestPayloadFingerprintInput => {
  return {
    riderName: ' River ',
    foundLocationMapUrl: ' https://maps.google.com/?q=found ',
    foundLatitude: 38.2527,
    foundLongitude: -85.7585,
    foundLocationAccuracyMeters: 12,
    foundLocationCapturedAt: '2026-06-14T12:00:00.000Z',
    matchPhoto: {
      name: 'match.jpg',
      type: 'image/jpeg',
      size: 150_000,
      lastModified: 1_781_466_613_004
    },
    nextTitle: ' Bridge view ',
    nextClue: ' Look where the trail bends. ',
    nextHiddenLocationMapUrl: ' https://maps.google.com/?q=next ',
    nextHiddenLatitude: 38.2531,
    nextHiddenLongitude: -85.759,
    nextHiddenLocationAccuracyMeters: 8,
    nextHiddenLocationCapturedAt: '2026-06-14T12:05:00.000Z',
    nextPhoto: {
      name: 'next.jpg',
      type: 'image/jpeg',
      size: 550_000,
      lastModified: 1_781_466_705_480
    }
  }
}

const createAttempt = (): SubmitRequestAttempt => {
  return {
    clientSubmissionId: '11111111-1111-4111-8111-111111111111',
    payloadFingerprint: createSubmitRequestPayloadFingerprint(createPayload())
  }
}

describe('submitRequestAttemptStorage', () => {
  beforeEach(() => {
    storage.clear()
    vi.clearAllMocks()

    vi.stubGlobal('window', {
      sessionStorage: sessionStorageMock
    })
  })

  describe('createSubmitRequestPayloadFingerprint', () => {
    it('normalizes outer whitespace for server-trimmed text fields', () => {
      const payload = createPayload()
      const normalizedPayload = {
        ...payload,
        riderName: 'River',
        foundLocationMapUrl: 'https://maps.google.com/?q=found',
        nextTitle: 'Bridge view',
        nextClue: 'Look where the trail bends.',
        nextHiddenLocationMapUrl: 'https://maps.google.com/?q=next'
      }

      expect(createSubmitRequestPayloadFingerprint(payload)).toBe(
        createSubmitRequestPayloadFingerprint(normalizedPayload)
      )
    })

    it('changes when a meaningful form field changes', () => {
      const payload = createPayload()

      expect(
        createSubmitRequestPayloadFingerprint({
          ...payload,
          nextClue: 'A different clue'
        })
      ).not.toBe(createSubmitRequestPayloadFingerprint(payload))
    })

    it('changes when either selected photo changes', () => {
      const payload = createPayload()

      expect(
        createSubmitRequestPayloadFingerprint({
          ...payload,
          nextPhoto: {
            ...payload.nextPhoto!,
            size: payload.nextPhoto!.size + 1
          }
        })
      ).not.toBe(createSubmitRequestPayloadFingerprint(payload))
    })
  })

  describe('attempt validation and storage', () => {
    it('recognizes a valid stored attempt', () => {
      expect(isSubmitRequestAttempt(createAttempt())).toBe(true)
    })

    it('rejects an invalid client submission UUID', () => {
      expect(
        isSubmitRequestAttempt({
          ...createAttempt(),
          clientSubmissionId: 'not-a-uuid'
        })
      ).toBe(false)
    })

    it('saves and loads the current attempt from session storage', () => {
      const attempt = createAttempt()

      saveSubmitRequestAttempt(attempt)

      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        'bikeTag.submitRequestAttempt.v1',
        JSON.stringify(attempt)
      )
      expect(loadSubmitRequestAttempt()).toEqual(attempt)
    })

    it('removes invalid stored data', () => {
      storage.set(
        'bikeTag.submitRequestAttempt.v1',
        JSON.stringify({ clientSubmissionId: 'bad' })
      )

      expect(loadSubmitRequestAttempt()).toBeNull()
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(
        'bikeTag.submitRequestAttempt.v1'
      )
    })

    it('clears the saved attempt', () => {
      clearSubmitRequestAttempt()

      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(
        'bikeTag.submitRequestAttempt.v1'
      )
    })
  })

  describe('resolveSubmitRequestAttempt', () => {
    it('reuses the active attempt for a manual retry in the same form session', () => {
      const attempt = createAttempt()
      const createId = vi.fn(() => '22222222-2222-4222-8222-222222222222')

      expect(
        resolveSubmitRequestAttempt({
          currentAttempt: attempt,
          payloadFingerprint: 'programmatic-photo-compression-changed-files',
          createClientSubmissionId: createId
        })
      ).toEqual({
        attempt,
        source: 'active'
      })
      expect(createId).not.toHaveBeenCalled()
    })

    it('reuses a matching stored attempt after the page is restored', () => {
      const attempt = createAttempt()
      saveSubmitRequestAttempt(attempt)
      const createId = vi.fn(() => '22222222-2222-4222-8222-222222222222')

      expect(
        resolveSubmitRequestAttempt({
          currentAttempt: null,
          payloadFingerprint: attempt.payloadFingerprint,
          createClientSubmissionId: createId
        })
      ).toEqual({
        attempt,
        source: 'stored'
      })
      expect(createId).not.toHaveBeenCalled()
    })

    it('creates and stores a new attempt when the payload changed', () => {
      saveSubmitRequestAttempt(createAttempt())
      const createId = vi.fn(() => '22222222-2222-4222-8222-222222222222')

      const result = resolveSubmitRequestAttempt({
        currentAttempt: null,
        payloadFingerprint: 'new-payload-fingerprint',
        createClientSubmissionId: createId
      })

      expect(result).toEqual({
        attempt: {
          clientSubmissionId: '22222222-2222-4222-8222-222222222222',
          payloadFingerprint: 'new-payload-fingerprint'
        },
        source: 'created'
      })
      expect(loadSubmitRequestAttempt()).toEqual(result.attempt)
    })
  })
})
