import { describe, expect, it } from 'vitest'
import { isValidGoogleMapsUrl } from '~~/shared/utils/mapValidation'

describe('mapValidation', () => {
  describe('isValidGoogleMapsUrl', () => {
    it('allows supported Google Maps URLs', () => {
      expect(
        isValidGoogleMapsUrl('https://www.google.com/maps/place/Louisville')
      ).toBe(true)

      expect(
        isValidGoogleMapsUrl('https://google.com/maps/place/Louisville')
      ).toBe(true)

      expect(
        isValidGoogleMapsUrl('https://maps.google.com/maps?q=Louisville')
      ).toBe(true)

      expect(isValidGoogleMapsUrl('https://maps.app.goo.gl/abc123')).toBe(true)
    })

    it('allows valid Google Maps URLs with leading and trailing spaces', () => {
      expect(
        isValidGoogleMapsUrl(' https://www.google.com/maps/place/Louisville ')
      ).toBe(true)
    })

    it('allows Google Maps URLs with query strings', () => {
      expect(
        isValidGoogleMapsUrl(
          'https://www.google.com/maps/search/?api=1&query=Louisville'
        )
      ).toBe(true)

      expect(
        isValidGoogleMapsUrl(
          'https://maps.google.com/maps?q=Louisville,+KY&hl=en'
        )
      ).toBe(true)
    })

    it('allows Google Maps URLs with coordinates', () => {
      expect(
        isValidGoogleMapsUrl('https://www.google.com/maps/@38.2527,-85.7585,14z')
      ).toBe(true)

      expect(
        isValidGoogleMapsUrl(
          'https://www.google.com/maps/search/38.2527,-85.7585'
        )
      ).toBe(true)
    })

    it('allows maps.app.goo.gl short links regardless of path shape', () => {
      expect(isValidGoogleMapsUrl('https://maps.app.goo.gl/abc123')).toBe(true)
      expect(isValidGoogleMapsUrl('https://maps.app.goo.gl/share')).toBe(true)
    })

    it('rejects empty values', () => {
      expect(isValidGoogleMapsUrl('')).toBe(false)
      expect(isValidGoogleMapsUrl(' ')).toBe(false)
    })

    it('rejects non HTTPS Google Maps URLs', () => {
      expect(
        isValidGoogleMapsUrl('http://www.google.com/maps/place/Louisville')
      ).toBe(false)

      expect(isValidGoogleMapsUrl('http://maps.app.goo.gl/abc123')).toBe(false)
    })

    it('rejects non Google Maps hosts', () => {
      expect(
        isValidGoogleMapsUrl('https://example.com/maps/place/Louisville')
      ).toBe(false)

      expect(
        isValidGoogleMapsUrl('https://evil-google.com/maps/place/Louisville')
      ).toBe(false)

      expect(
        isValidGoogleMapsUrl('https://google.com.evil.com/maps/place/Louisville')
      ).toBe(false)
    })

    it('rejects Google URLs that are not map paths', () => {
      expect(isValidGoogleMapsUrl('https://www.google.com/search?q=Louisville'))
        .toBe(false)

      expect(isValidGoogleMapsUrl('https://google.com/search?q=maps')).toBe(
        false
      )

      expect(isValidGoogleMapsUrl('https://www.google.com/images?q=maps')).toBe(
        false
      )
    })

    it('rejects malformed URLs', () => {
      expect(isValidGoogleMapsUrl('not a url')).toBe(false)

      expect(isValidGoogleMapsUrl('www.google.com/maps/place/Louisville')).toBe(
        false
      )
    })
  })
})