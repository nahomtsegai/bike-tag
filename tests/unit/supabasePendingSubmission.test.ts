import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
    it('creates a pending submission and returns submission ids', async () => {
      rpcMock.mockResolvedValueOnce({
        data: [
          {
            submission_id: 'submission-123',
            active_tag_id: 'tag-456'
          }
        ],
        error: null
      })

      await expect(
        createPendingSubmissionInSupabase(validPendingSubmissionInput)
      ).resolves.toEqual({
        submissionId: 'submission-123',
        activeTagId: 'tag-456'
      })

      expect(rpcMock).toHaveBeenCalledWith('create_private_pending_submission', {
        p_rider_name: 'Rider',
        p_found_location_map_url: 'https://maps.google.com/?q=38.1,-85.1',
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
        p_next_hidden_location_captured_at: '2026-06-11T12:05:00.000Z'
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