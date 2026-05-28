import { describe, expect, it } from 'vitest'
import { createMapUrl, isValidMapUrl } from '../../app/utils/mapLinks'

describe('mapLinks', () => {
  describe('createMapUrl', () => {
    it('returns a trimmed Google Maps URL when the link is valid', () => {
      expect(
        createMapUrl(' https://www.google.com/maps/place/Louisville ')
      ).toBe('https://www.google.com/maps/place/Louisville')
    })

    it('returns a maps.app.goo.gl URL when the link is valid', () => {
      expect(createMapUrl('https://maps.app.goo.gl/abc123')).toBe(
        'https://maps.app.goo.gl/abc123'
      )
    })

    it('returns an empty string when no URL is provided', () => {
      expect(createMapUrl()).toBe('')
      expect(createMapUrl('')).toBe('')
      expect(createMapUrl('   ')).toBe('')
    })

    it('returns an empty string for non Google Maps URLs', () => {
      expect(createMapUrl('https://example.com/maps/place/Louisville')).toBe('')
      expect(createMapUrl('https://evil-google.com/maps/place/Louisville')).toBe(
        ''
      )
    })

    it('returns an empty string for non HTTPS Google Maps URLs', () => {
      expect(createMapUrl('http://www.google.com/maps/place/Louisville')).toBe(
        ''
      )
      expect(createMapUrl('http://maps.app.goo.gl/abc123')).toBe('')
    })

    it('returns an empty string for malformed URLs', () => {
      expect(createMapUrl('not a url')).toBe('')
      expect(createMapUrl('www.google.com/maps/place/Louisville')).toBe('')
    })
  })

  describe('isValidMapUrl', () => {
    it('returns true for valid Google Maps URLs', () => {
      expect(isValidMapUrl('https://www.google.com/maps/place/Louisville')).toBe(
        true
      )
      expect(isValidMapUrl('https://maps.google.com/maps?q=Louisville')).toBe(
        true
      )
      expect(isValidMapUrl('https://maps.app.goo.gl/abc123')).toBe(true)
    })

    it('returns false for invalid map URLs', () => {
      expect(isValidMapUrl('')).toBe(false)
      expect(isValidMapUrl('https://example.com/maps/place/Louisville')).toBe(
        false
      )
      expect(isValidMapUrl('http://www.google.com/maps/place/Louisville')).toBe(
        false
      )
      expect(isValidMapUrl('not a url')).toBe(false)
    })
  })
})