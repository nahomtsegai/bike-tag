import { describe, expect, it } from 'vitest'
import {
  adminTagReplacementConfirmationText,
  adminTagReplacementSupersededReason,
  isAdminTagReplacementConfirmed
} from '../../shared/utils/adminTagReplacement'

describe('adminTagReplacement', () => {
  it('requires the exact replacement confirmation text', () => {
    expect(
      isAdminTagReplacementConfirmed(adminTagReplacementConfirmationText)
    ).toBe(true)
    expect(
      isAdminTagReplacementConfirmed(`  ${adminTagReplacementConfirmationText}  `)
    ).toBe(true)
    expect(isAdminTagReplacementConfirmed('replace current tag')).toBe(false)
    expect(isAdminTagReplacementConfirmed(undefined)).toBe(false)
  })

  it('uses a neutral superseded reason for affected submissions', () => {
    expect(adminTagReplacementSupersededReason).toBe(
      'The current tag was replaced by an administrator.'
    )
  })
})
