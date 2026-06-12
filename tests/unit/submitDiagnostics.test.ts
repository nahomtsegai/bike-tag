import { describe, expect, it } from 'vitest'
import { sanitizeSubmitDiagnosticMetadata } from '../../server/utils/submitDiagnostics'

describe('submitDiagnostics', () => {
  describe('sanitizeSubmitDiagnosticMetadata', () => {
    it('keeps useful primitive metadata values', () => {
      expect(
        sanitizeSubmitDiagnosticMetadata({
          hasMatchPhoto: true,
          matchPhotoSize: 12345,
          submitStatusMessage: 'Uploading photos',
          missingValue: null
        })
      ).toEqual({
        hasMatchPhoto: true,
        matchPhotoSize: 12345,
        submitStatusMessage: 'Uploading photos',
        missingValue: null
      })
    })

    it('removes unsupported metadata values', () => {
      const sanitizedMetadata = sanitizeSubmitDiagnosticMetadata({
        useful: 'value',
        unsupported: undefined,
        callback: () => 'nope',
        symbolValue: Symbol('nope')
      })

      expect(sanitizedMetadata).toEqual({
        useful: 'value'
      })
    })

    it('trims long metadata strings', () => {
      const sanitizedMetadata = sanitizeSubmitDiagnosticMetadata({
        longErrorMessage: 'x'.repeat(600)
      })

      expect(sanitizedMetadata.longErrorMessage).toBe('x'.repeat(300))
    })

    it('caps deeply nested metadata', () => {
      const sanitizedMetadata = sanitizeSubmitDiagnosticMetadata({
        levelOne: {
          levelTwo: {
            levelThree: {
              levelFour: 'too deep'
            }
          }
        }
      })

      expect(sanitizedMetadata).toEqual({
        levelOne: {
          levelTwo: {
            levelThree: '[Truncated nested metadata]'
          }
        }
      })
    })

    it('caps serialized metadata size', () => {
      const sanitizedMetadata = sanitizeSubmitDiagnosticMetadata(
        Object.fromEntries(
          Array.from({ length: 50 }, (_, index) => [
            `field${index}`,
            'x'.repeat(300)
          ])
        )
      )

      expect(JSON.stringify(sanitizedMetadata).length).toBeLessThanOrEqual(
        4000
      )
      expect(sanitizedMetadata._truncated).toBe(true)
      expect(typeof sanitizedMetadata._originalSize).toBe('number')
    })
  })
})