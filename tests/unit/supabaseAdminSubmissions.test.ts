import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchAdminSubmissionByIdFromSupabase,
  fetchAdminSubmissionsFromSupabase
} from '../../server/utils/supabaseAdminSubmissions'

const fromMock = vi.hoisted(() => vi.fn())
const selectMock = vi.hoisted(() => vi.fn())
const isMock = vi.hoisted(() => vi.fn())
const eqMock = vi.hoisted(() => vi.fn())
const orMock = vi.hoisted(() => vi.fn())
const orderMock = vi.hoisted(() => vi.fn())
const rangeMock = vi.hoisted(() => vi.fn())
const maybeSingleMock = vi.hoisted(() => vi.fn())
const overrideTypesMock = vi.hoisted(() => vi.fn())
const createSupabaseServerClientMock = vi.hoisted(() => vi.fn())
const resolveAdminPhotoUrlMock = vi.hoisted(() => vi.fn())

vi.mock('../../server/utils/supabase', () => {
  return {
    createSupabaseServerClient: createSupabaseServerClientMock
  }
})

vi.mock('../../server/utils/supabaseStorage', () => {
  return {
    resolveAdminPhotoUrl: resolveAdminPhotoUrlMock
  }
})

const queryMock = {
  select: selectMock,
  is: isMock,
  eq: eqMock,
  or: orMock,
  order: orderMock,
  range: rangeMock,
  maybeSingle: maybeSingleMock,
  overrideTypes: overrideTypesMock
}

const submissionRow = {
  id: 'submission-123',
  active_tag_id: 'tag-456',
  rider_name: 'Rider',
  found_location_map_url: 'https://maps.example.com/found',
  match_photo_url: null,
  match_photo_storage_path: 'submissions/abc/match-photo.jpg',
  next_title: 'Bridge Tag',
  next_clue: 'Look near the river.',
  next_hidden_location_map_url: 'https://maps.example.com/hidden',
  next_tag_photo_url: null,
  next_tag_photo_storage_path: 'submissions/abc/next-photo.jpg',
  found_latitude: 38.1,
  found_longitude: -85.1,
  found_location_accuracy_meters: 12,
  found_location_captured_at: '2026-06-14T12:00:00.000Z',
  next_hidden_latitude: 38.2,
  next_hidden_longitude: -85.2,
  next_hidden_location_accuracy_meters: 15,
  next_hidden_location_captured_at: '2026-06-14T12:05:00.000Z',
  status: 'pending' as const,
  rejection_reason: null,
  reviewed_at: null,
  reviewed_by: null,
  archived_at: null,
  created_at: '2026-06-14T12:10:00.000Z',
  updated_at: '2026-06-14T12:10:00.000Z'
}

describe('supabaseAdminSubmissions', () => {
  beforeEach(() => {
    fromMock.mockReset()
    selectMock.mockReset()
    isMock.mockReset()
    eqMock.mockReset()
    orMock.mockReset()
    orderMock.mockReset()
    rangeMock.mockReset()
    maybeSingleMock.mockReset()
    overrideTypesMock.mockReset()
    createSupabaseServerClientMock.mockReset()
    resolveAdminPhotoUrlMock.mockReset()

    fromMock.mockReturnValue(queryMock)
    selectMock.mockReturnValue(queryMock)
    isMock.mockReturnValue(queryMock)
    eqMock.mockReturnValue(queryMock)
    orMock.mockReturnValue(queryMock)
    orderMock.mockReturnValue(queryMock)
    rangeMock.mockReturnValue(queryMock)
    maybeSingleMock.mockReturnValue(queryMock)

    createSupabaseServerClientMock.mockReturnValue({
      from: fromMock
    })
  })

  describe('fetchAdminSubmissionByIdFromSupabase', () => {
    it('returns signed private photo URLs for an admin detail response', async () => {
      overrideTypesMock.mockResolvedValueOnce({
        data: submissionRow,
        error: null
      })
      resolveAdminPhotoUrlMock
        .mockResolvedValueOnce('https://example.supabase.co/signed/match')
        .mockResolvedValueOnce('https://example.supabase.co/signed/next')

      await expect(
        fetchAdminSubmissionByIdFromSupabase('submission-123')
      ).resolves.toMatchObject({
        id: 'submission-123',
        matchPhotoUrl: 'https://example.supabase.co/signed/match',
        nextTagPhotoUrl: 'https://example.supabase.co/signed/next'
      })

      expect(resolveAdminPhotoUrlMock).toHaveBeenNthCalledWith(1, {
        publicUrl: null,
        storagePath: 'submissions/abc/match-photo.jpg'
      })
      expect(resolveAdminPhotoUrlMock).toHaveBeenNthCalledWith(2, {
        publicUrl: null,
        storagePath: 'submissions/abc/next-photo.jpg'
      })
      expect(selectMock).toHaveBeenCalledWith(
        expect.stringContaining('match_photo_storage_path')
      )
      expect(selectMock).toHaveBeenCalledWith(
        expect.stringContaining('next_tag_photo_storage_path')
      )
    })

    it('preserves legacy public photo URLs when private paths are absent', async () => {
      const legacyRow = {
        ...submissionRow,
        match_photo_url: 'https://example.com/public/match.jpg',
        match_photo_storage_path: null,
        next_tag_photo_url: 'https://example.com/public/next.jpg',
        next_tag_photo_storage_path: null
      }

      overrideTypesMock.mockResolvedValueOnce({
        data: legacyRow,
        error: null
      })
      resolveAdminPhotoUrlMock.mockImplementation(
        ({ publicUrl }: { publicUrl: string | null }) => {
          return Promise.resolve(publicUrl ?? '')
        }
      )

      await expect(
        fetchAdminSubmissionByIdFromSupabase('submission-123')
      ).resolves.toMatchObject({
        matchPhotoUrl: 'https://example.com/public/match.jpg',
        nextTagPhotoUrl: 'https://example.com/public/next.jpg'
      })
    })
  })

  describe('fetchAdminSubmissionsFromSupabase', () => {
    it('does not generate signed URLs for the submission list', async () => {
      overrideTypesMock.mockResolvedValueOnce({
        data: [submissionRow],
        error: null,
        count: 1
      })

      await expect(
        fetchAdminSubmissionsFromSupabase({
          status: 'pending',
          search: undefined,
          limit: 25,
          offset: 0,
          includeArchived: false
        })
      ).resolves.toMatchObject({
        submissions: [
          {
            id: 'submission-123',
            matchPhotoUrl: '',
            nextTagPhotoUrl: ''
          }
        ],
        pagination: {
          count: 1,
          hasMore: false
        }
      })

      expect(resolveAdminPhotoUrlMock).not.toHaveBeenCalled()
    })
  })
})
