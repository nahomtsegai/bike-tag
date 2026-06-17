import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { activeTagChangedStatusMessage } from '../../shared/utils/submitActiveTag'
import { createPendingSubmissionInSupabase } from '../../server/utils/supabasePendingSubmission'

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

const validPendingSubmissionInput = {
  clientSubmissionId: '11111111-1111-4111-8111-111111111111',
  expectedActiveTagId: '22222222-2222-4222-8222-222222222222',
  riderName: 'Rider',
  foundLocationMapUrl: 'https://maps.google.com/?q=38.1,-85.1',
  matchPhotoStoragePath: 'submissions/group-123/match_photo.png',
  nextTitle: 'Next mystery spot',
  nextClue: 'Look near the river.',
  nextHiddenLocationMapUrl: 'https://maps.google.com/?q=38.2,-85.2',
  nextTagPhotoStoragePath: 'submissions/group-123/tag_photo.png',
  foundLatitude: 38.1,
  foundLongitude: -85.1,
  foundLocationAccuracyMeters: 12,
  foundLocationCapturedAt: '2026-06-11T12:00:00.000Z',
  nextHiddenLatitude: 38.2,
  nextHiddenLongitude: -85.2,
  nextHiddenLocationAccuracyMeters: 15,
  nextHiddenLocationCapturedAt: '2026-06-11T12:05:00.000Z'
}

describe('supabasePendingSubmission', () => {
  beforeEach(() => {
    rpcMock.mockReset()
    vi.stubGlobal('createError', createTestError)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('createPendingSubmissionInSupabase', () => {
    it('creates a tag-bound pending submission and returns submission ids', async () => {
      rpcMock.mockResolvedValueOnce({
        data: [
          {
            submission_id: 'submission-123',
            active_tag_id: 'tag-456',
            was_created: true
          }
        ],
        error: null
      })

      await expect(
        createPendingSubmissionInSupabase(validPendingSubmissionInput)
      ).resolves.toEqual({
        submissionId: 'submission-123',
        activeTagId: 'tag-456',
        wasCreated: true
      })

      expect(rpcMock).toHaveBeenCalledWith(
        'create_tag_bound_idempotent_private_pending_submission',
        {
          p_client_submission_id:
            '11111111-1111-4111-8111-111111111111',
          p_expected_active_tag_id:
            '22222222-2222-4222-8222-222222222222',
          p_rider_name: 'Rider',
          p_found_location_map_url:
            'https://maps.google.com/?q=38.1,-85.1',
          p_match_photo_storage_path:
            'submissions/group-123/match_photo.png',
          p_next_title: 'Next mystery spot',
          p_next_clue: 'Look near the river.',
          p_next_hidden_location_map_url:
            'https://maps.google.com/?q=38.2,-85.2',
          p_next_tag_photo_storage_path:
            'submissions/group-123/tag_photo.png',
          p_found_latitude: 38.1,
          p_found_longitude: -85.1,
          p_found_location_accuracy_meters: 12,
          p_found_location_captured_at: '2026-06-11T12:00:00.000Z',
          p_next_hidden_latitude: 38.2,
          p_next_hidden_longitude: -85.2,
          p_next_hidden_location_accuracy_meters: 15,
          p_next_hidden_location_captured_at:
            '2026-06-11T12:05:00.000Z'
        }
      )
    })

    it('returns an existing submission for an idempotent retry', async () => {
      rpcMock.mockResolvedValueOnce({
        data: [
          {
            submission_id: 'submission-123',
            active_tag_id: 'tag-456',
            was_created: false
          }
        ],
        error: null
      })

      await expect(
        createPendingSubmissionInSupabase(validPendingSubmissionInput)
      ).resolves.toEqual({
        submissionId: 'submission-123',
        activeTagId: 'tag-456',
        wasCreated: false
      })
    })

    it('rejects an invalid expected active tag id before calling Supabase', async () => {
      await expect(
        createPendingSubmissionInSupabase({
          ...validPendingSubmissionInput,
          expectedActiveTagId: 'not-a-uuid'
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Expected active tag ID must be a valid UUID.'
      })

      expect(rpcMock).not.toHaveBeenCalled()
    })

    it('maps active tag changes to a conflict', async () => {
      rpcMock.mockResolvedValueOnce({
        data: null,
        error: {
          message: 'ACTIVE_TAG_CHANGED'
        }
      })

      await expect(
        createPendingSubmissionInSupabase(validPendingSubmissionInput)
      ).rejects.toMatchObject({
        statusCode: 409,
        statusMessage: activeTagChangedStatusMessage
      })
    })

    it('maps idempotent tag mismatches to the same conflict', async () => {
      rpcMock.mockResolvedValueOnce({
        data: null,
        error: {
          message: 'IDEMPOTENT_SUBMISSION_TAG_MISMATCH'
        }
      })

      await expect(
        createPendingSubmissionInSupabase(validPendingSubmissionInput)
      ).rejects.toMatchObject({
        statusCode: 409,
        statusMessage: activeTagChangedStatusMessage
      })
    })

    it('maps missing active tag errors to a conflict', async () => {
      rpcMock.mockResolvedValueOnce({
        data: null,
        error: {
          message: 'No active tag found.'
        }
      })

      await expect(
        createPendingSubmissionInSupabase(validPendingSubmissionInput)
      ).rejects.toMatchObject({
        statusCode: 409,
        statusMessage: 'There is no active Bike Tag to submit against yet.'
      })
    })

    it('maps RPC validation errors to bad requests', async () => {
      rpcMock.mockResolvedValueOnce({
        data: null,
        error: {
          message: 'Rider name is required.'
        }
      })

      await expect(
        createPendingSubmissionInSupabase(validPendingSubmissionInput)
      ).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Rider name is required.'
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
        createPendingSubmissionInSupabase(validPendingSubmissionInput)
      ).rejects.toMatchObject({
        statusCode: 500,
        statusMessage:
          'Could not create pending submission in Supabase: database exploded'
      })
    })

    it('throws when the RPC returns an unexpected response shape', async () => {
      rpcMock.mockResolvedValueOnce({
        data: [
          {
            submission_id: 'submission-123'
          }
        ],
        error: null
      })

      await expect(
        createPendingSubmissionInSupabase(validPendingSubmissionInput)
      ).rejects.toMatchObject({
        statusCode: 500,
        statusMessage:
          'Supabase pending submission function did not return a valid result.'
      })
    })
  })
})
