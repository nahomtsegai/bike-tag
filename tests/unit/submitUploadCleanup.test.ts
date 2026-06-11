import { describe, expect, it } from 'vitest'
import {
  shouldCleanupSubmitUploads,
  shouldSkipSubmitUploadCleanup
} from '../../server/utils/submitUploadCleanup'

describe('submitUploadCleanup', () => {
  describe('shouldCleanupSubmitUploads', () => {
    it('returns true when uploads exist and no submission was created', () => {
      expect(
        shouldCleanupSubmitUploads({
          uploadedStoragePaths: ['tags/temp/match_photo.png'],
          submissionId: null
        })
      ).toBe(true)
    })

    it('returns false when no uploads exist', () => {
      expect(
        shouldCleanupSubmitUploads({
          uploadedStoragePaths: [],
          submissionId: null
        })
      ).toBe(false)
    })

    it('returns false when a submission was created', () => {
      expect(
        shouldCleanupSubmitUploads({
          uploadedStoragePaths: ['tags/temp/match_photo.png'],
          submissionId: 'submission-123'
        })
      ).toBe(false)
    })
  })

  describe('shouldSkipSubmitUploadCleanup', () => {
    it('returns true when uploads exist and a submission was created', () => {
      expect(
        shouldSkipSubmitUploadCleanup({
          uploadedStoragePaths: ['tags/temp/match_photo.png'],
          submissionId: 'submission-123'
        })
      ).toBe(true)
    })

    it('returns false when no uploads exist', () => {
      expect(
        shouldSkipSubmitUploadCleanup({
          uploadedStoragePaths: [],
          submissionId: 'submission-123'
        })
      ).toBe(false)
    })

    it('returns false when no submission was created', () => {
      expect(
        shouldSkipSubmitUploadCleanup({
          uploadedStoragePaths: ['tags/temp/match_photo.png'],
          submissionId: null
        })
      ).toBe(false)
    })
  })
})