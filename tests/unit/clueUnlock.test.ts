import { describe, expect, it } from 'vitest'

import {
  createClueUnlocksAtIso,
  defaultClueUnlockDelayDays,
  isValidClueUnlockDelayDays,
  resolveClueUnlocksAtIso
} from '../../shared/utils/clueUnlock'

describe('clue unlock utilities', () => {
  it('uses the five-day default delay', () => {
    expect(defaultClueUnlockDelayDays).toBe(5)
    expect(
      createClueUnlocksAtIso({
        createdAtIso: '2026-06-22T12:00:00.000Z'
      })
    ).toBe('2026-06-27T12:00:00.000Z')
  })

  it('supports an immediate clue reveal', () => {
    expect(
      createClueUnlocksAtIso({
        createdAtIso: '2026-06-22T12:00:00.000Z',
        delayDays: 0
      })
    ).toBe('2026-06-22T12:00:00.000Z')
  })

  it('keeps a stored unlock timestamp instead of recalculating it', () => {
    expect(
      resolveClueUnlocksAtIso({
        createdAtIso: '2026-06-22T12:00:00.000Z',
        clueUnlocksAtIso: '2026-06-24T12:00:00.000Z'
      })
    ).toBe('2026-06-24T12:00:00.000Z')
  })

  it('validates whole-day settings from zero through thirty', () => {
    expect(isValidClueUnlockDelayDays(0)).toBe(true)
    expect(isValidClueUnlockDelayDays(30)).toBe(true)
    expect(isValidClueUnlockDelayDays(-1)).toBe(false)
    expect(isValidClueUnlockDelayDays(31)).toBe(false)
    expect(isValidClueUnlockDelayDays(2.5)).toBe(false)
    expect(isValidClueUnlockDelayDays('5')).toBe(false)
  })
})
