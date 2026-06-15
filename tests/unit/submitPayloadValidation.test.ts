import { describe, expect, it } from 'vitest'
import {
  isAllowedCombinedSubmitPhotoSize,
  maxCombinedSubmitPhotoSizeInBytes
} from '../../shared/utils/imageValidation'

describe('submit payload validation', () => {
  it('allows two prepared photos at the combined upload limit', () => {
    expect(
      isAllowedCombinedSubmitPhotoSize(
        2_000_000,
        2_000_000,
        maxCombinedSubmitPhotoSizeInBytes
      )
    ).toBe(true)
  })

  it('rejects two prepared photos over the combined upload limit', () => {
    expect(
      isAllowedCombinedSubmitPhotoSize(
        2_000_001,
        2_000_000,
        maxCombinedSubmitPhotoSizeInBytes
      )
    ).toBe(false)
  })

  it('rejects missing or empty photo sizes', () => {
    expect(
      isAllowedCombinedSubmitPhotoSize(
        0,
        2_000_000,
        maxCombinedSubmitPhotoSizeInBytes
      )
    ).toBe(false)

    expect(
      isAllowedCombinedSubmitPhotoSize(
        2_000_000,
        0,
        maxCombinedSubmitPhotoSizeInBytes
      )
    ).toBe(false)
  })
})
