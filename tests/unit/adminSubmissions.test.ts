import { describe, expect, it } from 'vitest'
import {
  formatAdminDate,
  formatStatus,
  getImageErrorKey,
  getStatusBadgeClass
} from '../../app/utils/adminSubmissions'

describe('adminSubmissions', () => {
  describe('formatStatus', () => {
    it('formats admin submission statuses for display', () => {
      expect(formatStatus('pending')).toBe('Pending')
      expect(formatStatus('approved')).toBe('Approved')
      expect(formatStatus('rejected')).toBe('Rejected')
    })
  })

  describe('formatAdminDate', () => {
    it('returns a fallback when the date value is missing', () => {
      expect(formatAdminDate(null)).toBe('Not available')
    })

    it('formats a valid date for admin display', () => {
      expect(formatAdminDate('2026-05-24T12:30:00.000Z')).toContain(
        'May 24, 2026'
      )
    })
  })

  describe('getStatusBadgeClass', () => {
    it('returns the pending status class', () => {
      expect(getStatusBadgeClass('pending')).toEqual({
        'status-pill-pending': true,
        'status-pill-approved': false,
        'status-pill-rejected': false
      })
    })

    it('returns the approved status class', () => {
      expect(getStatusBadgeClass('approved')).toEqual({
        'status-pill-pending': false,
        'status-pill-approved': true,
        'status-pill-rejected': false
      })
    })

    it('returns the rejected status class', () => {
      expect(getStatusBadgeClass('rejected')).toEqual({
        'status-pill-pending': false,
        'status-pill-approved': false,
        'status-pill-rejected': true
      })
    })
  })

  describe('getImageErrorKey', () => {
    it('returns a stable image error key', () => {
      expect(getImageErrorKey('submission-123', 'matchPhoto')).toBe(
        'submission-123:matchPhoto'
      )

      expect(getImageErrorKey('submission-123', 'nextTagPhoto')).toBe(
        'submission-123:nextTagPhoto'
      )
    })
  })
})