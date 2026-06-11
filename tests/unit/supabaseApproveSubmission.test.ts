import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { approveSubmissionInSupabase } from '../../server/utils/supabaseApproveSubmission'

type CreateErrorInput = {
  statusCode: number
  statusMessage: string
}

const rpcMock = vi.hoisted(() => vi.fn())

vi.mock('../../server/utils/supabase', () => {
  return {
    createSupabaseServerClient: () => {
      return {
        rpc: rpcMock
      }
    }
  }
})

const createTestError = ({ statusCode, statusMessage }: CreateErrorInput) => {
  const error = new Error(statusMessage) as Error & CreateErrorInput

  error.statusCode = statusCode
  error.statusMessage = statusMessage

  return error
}

const validApproveSubmissionInput = {
  submissionId: 'submission-123',
  reviewedBy: 'Admin Rider'
}

describe('supabaseApproveSubmission', () => {
  beforeEach(() => {
    rpcMock.mockReset()
    vi.stubGlobal('createError', createTestError)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('approveSubmissionInSupabase', () => {
    it('approves a submission and returns approval ids', async () => {
      rpcMock.mockResolvedValueOnce({
        data: [
          {
            submission_id: 'submission-123',
            found_tag_id: 'found-tag-456',
            current_tag_id: 'current-tag-789'
          }
        ],
        error: null
      })

      await expect(
        approveSubmissionInSupabase(validApproveSubmissionInput)
      ).resolves.toEqual({
        submissionId: 'submission-123',
        foundTagId: 'found-tag-456',
        currentTagId: 'current-tag-789'
      })

      expect(rpcMock).toHaveBeenCalledWith('approve_submission', {
        p_submission_id: 'submission-123',
        p_reviewed_by: 'Admin Rider'
      })
    })

    it('maps already-reviewed submissions to a conflict', async () => {
      rpcMock.mockResolvedValueOnce({
        data: null,
        error: {
          message: 'SUBMISSION_NOT_PENDING'
        }
      })

      await expect(
        approveSubmissionInSupabase(validApproveSubmissionInput)
      ).rejects.toMatchObject({
        statusCode: 409,
        statusMessage: 'Submission has already been reviewed.'
      })
    })

    it('maps approved-submission uniqueness conflicts to a conflict', async () => {
      rpcMock.mockResolvedValueOnce({
        data: null,
        error: {
          code: '23505',
          message: 'duplicate key value violates unique constraint',
          details:
            'Key violates constraint one_approved_submission_per_active_tag.'
        }
      })

      await expect(
        approveSubmissionInSupabase(validApproveSubmissionInput)
      ).rejects.toMatchObject({
        statusCode: 409,
        statusMessage: 'This tag already has an approved submission.'
      })
    })

    it('maps active-tag uniqueness conflicts to a conflict', async () => {
      rpcMock.mockResolvedValueOnce({
        data: null,
        error: {
          code: '23505',
          message: 'duplicate key value violates unique constraint one_active_tag'
        }
      })

      await expect(
        approveSubmissionInSupabase(validApproveSubmissionInput)
      ).rejects.toMatchObject({
        statusCode: 409,
        statusMessage: 'Another active tag already exists.'
      })
    })

    it('maps unexpected RPC errors to server errors', async () => {
      rpcMock.mockResolvedValueOnce({
        data: null,
        error: {
          message: 'database exploded'
        }
      })

      await expect(
        approveSubmissionInSupabase(validApproveSubmissionInput)
      ).rejects.toMatchObject({
        statusCode: 500,
        statusMessage:
          'Could not approve submission in Supabase: database exploded'
      })
    })

    it('throws when the RPC returns an unexpected response shape', async () => {
      rpcMock.mockResolvedValueOnce({
        data: [
          {
            submission_id: 'submission-123',
            found_tag_id: 'found-tag-456'
          }
        ],
        error: null
      })

      await expect(
        approveSubmissionInSupabase(validApproveSubmissionInput)
      ).rejects.toMatchObject({
        statusCode: 500,
        statusMessage:
          'Supabase approve submission function did not return a valid result.'
      })
    })
  })
})