import { describe, expect, it, vi } from 'vitest'
import {
  clearLatestSubmissionReference,
  getLatestSubmissionReference,
  saveLatestSubmissionReference
} from '../../app/utils/latestSubmissionReferenceStorage'

const createStorageMock = () => {
  const values = new Map<string, string>()

  return {
    getItem: vi.fn((key: string) => {
      return values.get(key) ?? null
    }),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value)
    }),
    removeItem: vi.fn((key: string) => {
      values.delete(key)
    })
  }
}

describe('latest submission reference storage', () => {
  it('saves the latest submission reference', () => {
    const storage = createStorageMock()

    saveLatestSubmissionReference(
      'de865890-a6b4-47b7-bd57-2067da7477f0',
      storage
    )

    expect(storage.setItem).toHaveBeenCalledWith(
      'bikeTag.latestSubmissionReference',
      'de865890-a6b4-47b7-bd57-2067da7477f0'
    )
  })

  it('trims whitespace before saving the reference', () => {
    const storage = createStorageMock()

    saveLatestSubmissionReference(
      '  de865890-a6b4-47b7-bd57-2067da7477f0  ',
      storage
    )

    expect(storage.setItem).toHaveBeenCalledWith(
      'bikeTag.latestSubmissionReference',
      'de865890-a6b4-47b7-bd57-2067da7477f0'
    )
  })

  it('does not save an empty reference', () => {
    const storage = createStorageMock()

    saveLatestSubmissionReference('   ', storage)

    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it('returns the saved latest submission reference', () => {
    const storage = createStorageMock()

    saveLatestSubmissionReference(
      'de865890-a6b4-47b7-bd57-2067da7477f0',
      storage
    )

    expect(getLatestSubmissionReference(storage)).toBe(
      'de865890-a6b4-47b7-bd57-2067da7477f0'
    )
  })

  it('returns an empty string when no reference is saved', () => {
    const storage = createStorageMock()

    expect(getLatestSubmissionReference(storage)).toBe('')
  })

  it('clears the saved latest submission reference', () => {
    const storage = createStorageMock()

    saveLatestSubmissionReference(
      'de865890-a6b4-47b7-bd57-2067da7477f0',
      storage
    )

    clearLatestSubmissionReference(storage)

    expect(storage.removeItem).toHaveBeenCalledWith(
      'bikeTag.latestSubmissionReference'
    )

    expect(getLatestSubmissionReference(storage)).toBe('')
  })

  it('safely no ops when storage is unavailable', () => {
    expect(() => {
      saveLatestSubmissionReference(
        'de865890-a6b4-47b7-bd57-2067da7477f0',
        null
      )

      getLatestSubmissionReference(null)
      clearLatestSubmissionReference(null)
    }).not.toThrow()
  })
})