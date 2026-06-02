import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearSubmitTagDraft,
  createEmptySubmitTagDraft,
  isSubmitTagDraft,
  loadSubmitTagDraft,
  saveSubmitTagDraft,
  type SubmitTagDraft
} from '../../app/utils/submitTagDraftStorage'

const storage = new Map<string, string>()

const localStorageMock = {
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

const createDraft = (): SubmitTagDraft => {
  return {
    riderName: 'River',
    foundLocationMapUrl: 'https://maps.google.com/maps?q=Current+Tag',
    foundLatitude: 38.2527,
    foundLongitude: -85.7585,
    foundLocationAccuracyMeters: 24,
    foundLocationCapturedAt: '2026-05-29T12:00:00.000Z',
    notes: 'Near the bridge.',
    nextTitle: 'Bridge view',
    nextClue: 'Look where the trail bends.',
    nextHiddenLocationMapUrl: 'https://maps.google.com/maps?q=Next+Tag',
    nextHiddenLatitude: null,
    nextHiddenLongitude: null,
    nextHiddenLocationAccuracyMeters: null,
    nextHiddenLocationCapturedAt: null
  }
}

describe('submitTagDraftStorage', () => {
  beforeEach(() => {
    storage.clear()
    vi.clearAllMocks()

    vi.stubGlobal('window', {
      localStorage: localStorageMock
    })
  })

  describe('createEmptySubmitTagDraft', () => {
    it('creates an empty draft shape', () => {
      expect(createEmptySubmitTagDraft()).toEqual({
        riderName: '',
        foundLocationMapUrl: '',
        foundLatitude: null,
        foundLongitude: null,
        foundLocationAccuracyMeters: null,
        foundLocationCapturedAt: null,
        notes: '',
        nextTitle: '',
        nextClue: '',
        nextHiddenLocationMapUrl: '',
        nextHiddenLatitude: null,
        nextHiddenLongitude: null,
        nextHiddenLocationAccuracyMeters: null,
        nextHiddenLocationCapturedAt: null
      })
    })
  })

  describe('isSubmitTagDraft', () => {
    it('returns true for a valid draft', () => {
      expect(isSubmitTagDraft(createDraft())).toBe(true)
    })

    it('returns false for a missing field', () => {
      const draft = createDraft()
      const incompleteDraft = { ...draft, riderName: undefined }

      expect(isSubmitTagDraft(incompleteDraft)).toBe(false)
    })

    it('returns false for invalid metadata', () => {
      const draft = createDraft()
      const invalidDraft = {
        ...draft,
        foundLatitude: '38.2527'
      }

      expect(isSubmitTagDraft(invalidDraft)).toBe(false)
    })
  })

  describe('saveSubmitTagDraft', () => {
    it('saves a draft to local storage', () => {
      const draft = createDraft()

      saveSubmitTagDraft(draft)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'bikeTag.submitDraft.v1',
        JSON.stringify(draft)
      )
    })
  })

  describe('loadSubmitTagDraft', () => {
    it('loads a valid saved draft', () => {
      const draft = createDraft()

      storage.set('bikeTag.submitDraft.v1', JSON.stringify(draft))

      expect(loadSubmitTagDraft()).toEqual(draft)
    })

    it('returns null when there is no saved draft', () => {
      expect(loadSubmitTagDraft()).toBeNull()
    })

    it('returns null for invalid JSON', () => {
      storage.set('bikeTag.submitDraft.v1', '{bad json')

      expect(loadSubmitTagDraft()).toBeNull()
    })

    it('returns null for an invalid draft shape', () => {
      storage.set(
        'bikeTag.submitDraft.v1',
        JSON.stringify({
          riderName: 'River'
        })
      )

      expect(loadSubmitTagDraft()).toBeNull()
    })
  })

  describe('clearSubmitTagDraft', () => {
    it('removes the saved draft', () => {
      clearSubmitTagDraft()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'bikeTag.submitDraft.v1'
      )
    })
  })
})