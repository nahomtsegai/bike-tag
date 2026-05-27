import { describe, expect, it } from 'vitest'
import {
  createDefaultAdminPagination,
  getNextAdminPaginationOffset,
  getPreviousAdminPaginationOffset
} from '../../app/utils/adminPagination'

describe('adminPagination', () => {
  describe('createDefaultAdminPagination', () => {
    it('creates a default pagination state', () => {
      expect(
        createDefaultAdminPagination({
          limit: 25,
          offset: 50
        })
      ).toEqual({
        limit: 25,
        offset: 50,
        count: 0,
        hasMore: false
      })
    })
  })

  describe('getPreviousAdminPaginationOffset', () => {
    it('subtracts the limit from the current offset', () => {
      expect(
        getPreviousAdminPaginationOffset({
          currentOffset: 50,
          limit: 25
        })
      ).toBe(25)
    })

    it('does not return an offset below zero', () => {
      expect(
        getPreviousAdminPaginationOffset({
          currentOffset: 10,
          limit: 25
        })
      ).toBe(0)
    })
  })

  describe('getNextAdminPaginationOffset', () => {
    it('adds the limit to the current offset', () => {
      expect(
        getNextAdminPaginationOffset({
          currentOffset: 50,
          limit: 25
        })
      ).toBe(75)
    })
  })
})