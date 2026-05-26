import { describe, expect, it } from 'vitest'
import { buildAdminSubmissionsQueryParams } from '../../app/utils/adminSubmissionQueries'

describe('adminSubmissionQueries', () => {
  describe('buildAdminSubmissionsQueryParams', () => {
    it('always includes limit and offset', () => {
      expect(
        buildAdminSubmissionsQueryParams({
          selectedStatus: '',
          searchQuery: '',
          limit: 25,
          offset: 0
        })
      ).toBe('limit=25&offset=0')
    })

    it('includes status when selected', () => {
      expect(
        buildAdminSubmissionsQueryParams({
          selectedStatus: 'pending',
          searchQuery: '',
          limit: 25,
          offset: 0
        })
      ).toBe('limit=25&offset=0&status=pending')
    })

    it('trims and includes search when provided', () => {
      expect(
        buildAdminSubmissionsQueryParams({
          selectedStatus: '',
          searchQuery: '  river trail  ',
          limit: 25,
          offset: 0
        })
      ).toBe('limit=25&offset=0&search=river+trail')
    })

    it('excludes empty search after trimming', () => {
      expect(
        buildAdminSubmissionsQueryParams({
          selectedStatus: '',
          searchQuery: '   ',
          limit: 25,
          offset: 0
        })
      ).toBe('limit=25&offset=0')
    })

    it('includes status and search together', () => {
      expect(
        buildAdminSubmissionsQueryParams({
          selectedStatus: 'rejected',
          searchQuery: 'bad map link',
          limit: 50,
          offset: 100
        })
      ).toBe('limit=50&offset=100&status=rejected&search=bad+map+link')
    })
  })
})