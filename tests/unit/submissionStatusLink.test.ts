import { describe, expect, it } from 'vitest'
import { buildSubmissionStatusUrl } from '../../app/utils/submissionStatusLink'

describe('submission status link', () => {
  it('returns an empty string when the reference code is missing', () => {
    expect(buildSubmissionStatusUrl('')).toBe('')
  })

  it('returns a relative status path when no origin is provided', () => {
    expect(
      buildSubmissionStatusUrl('de865890-a6b4-47b7-bd57-2067da7477f0')
    ).toBe(
      '/submission-status?reference=de865890-a6b4-47b7-bd57-2067da7477f0'
    )
  })

  it('returns a full status URL when an origin is provided', () => {
    expect(
      buildSubmissionStatusUrl(
        'de865890-a6b4-47b7-bd57-2067da7477f0',
        'http://localhost:3000'
      )
    ).toBe(
      'http://localhost:3000/submission-status?reference=de865890-a6b4-47b7-bd57-2067da7477f0'
    )
  })

  it('encodes the reference code safely', () => {
    expect(
      buildSubmissionStatusUrl('reference with spaces', 'https://example.com')
    ).toBe(
      'https://example.com/submission-status?reference=reference+with+spaces'
    )
  })
})