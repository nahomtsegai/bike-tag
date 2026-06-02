import { createSupabaseServerClient } from './supabase'

export type AdminSubmissionStatus = 'pending' | 'approved' | 'rejected'

type AdminSubmissionRow = {
  id: string
  active_tag_id: string
  rider_name: string
  found_location_map_url: string
  match_photo_url: string
  next_title: string
  next_clue: string
  next_hidden_location_map_url: string
  next_tag_photo_url: string
  found_latitude: number | null
  found_longitude: number | null
  found_location_accuracy_meters: number | null
  found_location_captured_at: string | null
  next_hidden_latitude: number | null
  next_hidden_longitude: number | null
  next_hidden_location_accuracy_meters: number | null
  next_hidden_location_captured_at: string | null
  status: AdminSubmissionStatus
  rejection_reason: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

type FetchAdminSubmissionsOptions = {
  status?: AdminSubmissionStatus
  search?: string
  limit: number
  offset: number
}

const submissionSelectColumns = [
  'id',
  'active_tag_id',
  'rider_name',
  'found_location_map_url',
  'match_photo_url',
  'next_title',
  'next_clue',
  'next_hidden_location_map_url',
  'next_tag_photo_url',
  'found_latitude',
  'found_longitude',
  'found_location_accuracy_meters',
  'found_location_captured_at',
  'next_hidden_latitude',
  'next_hidden_longitude',
  'next_hidden_location_accuracy_meters',
  'next_hidden_location_captured_at',
  'status',
  'rejection_reason',
  'reviewed_at',
  'reviewed_by',
  'archived_at',
  'created_at',
  'updated_at'
].join(', ')

const createAdminSubmissionsError = (message: string) => {
  return createError({
    statusCode: 500,
    statusMessage: message
  })
}

const createSubmissionNotFoundError = () => {
  return createError({
    statusCode: 404,
    statusMessage: 'Submission was not found.'
  })
}

const mapAdminSubmission = (submission: AdminSubmissionRow) => {
  return {
    id: submission.id,
    activeTagId: submission.active_tag_id,
    riderName: submission.rider_name,
    foundLocationMapUrl: submission.found_location_map_url,
    matchPhotoUrl: submission.match_photo_url,
    nextTitle: submission.next_title,
    nextClue: submission.next_clue,
    nextHiddenLocationMapUrl: submission.next_hidden_location_map_url,
    nextTagPhotoUrl: submission.next_tag_photo_url,
    foundLatitude: submission.found_latitude,
    foundLongitude: submission.found_longitude,
    foundLocationAccuracyMeters: submission.found_location_accuracy_meters,
    foundLocationCapturedAt: submission.found_location_captured_at,
    nextHiddenLatitude: submission.next_hidden_latitude,
    nextHiddenLongitude: submission.next_hidden_longitude,
    nextHiddenLocationAccuracyMeters:
      submission.next_hidden_location_accuracy_meters,
    nextHiddenLocationCapturedAt: submission.next_hidden_location_captured_at,
    status: submission.status,
    rejectionReason: submission.rejection_reason,
    reviewedAt: submission.reviewed_at,
    reviewedBy: submission.reviewed_by,
    archivedAt: submission.archived_at,
    createdAt: submission.created_at,
    updatedAt: submission.updated_at
  }
}

export const isAdminSubmissionStatus = (
  value: unknown
): value is AdminSubmissionStatus => {
  return value === 'pending' || value === 'approved' || value === 'rejected'
}

export const fetchAdminSubmissionsFromSupabase = async ({
  status,
  search,
  limit,
  offset
}: FetchAdminSubmissionsOptions) => {
  const supabase = createSupabaseServerClient()
  const from = offset
  const to = offset + limit - 1

  let query = supabase
    .from('submissions')
    .select(submissionSelectColumns, { count: 'exact' })
    .is('archived_at', null)

  if (status) {
    query = query.eq('status', status)
  }

  if (search) {
    const searchPattern = `%${search}%`

    query = query.or(
      [
        `rider_name.ilike.${searchPattern}`,
        `next_title.ilike.${searchPattern}`,
        `next_clue.ilike.${searchPattern}`,
        `rejection_reason.ilike.${searchPattern}`
      ].join(',')
    )
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)
    .overrideTypes<AdminSubmissionRow[], { merge: false }>()

  if (error) {
    throw createAdminSubmissionsError(
      `Could not load admin submissions from Supabase: ${error.message}`
    )
  }

  return {
    submissions: (data ?? []).map(mapAdminSubmission),
    pagination: {
      limit,
      offset,
      count: count ?? 0,
      hasMore: offset + limit < (count ?? 0)
    }
  }
}

export const fetchAdminSubmissionByIdFromSupabase = async (
  submissionId: string
) => {
  const supabase = createSupabaseServerClient()

  const { data, error } = await supabase
    .from('submissions')
    .select(submissionSelectColumns)
    .eq('id', submissionId)
    .maybeSingle()
    .overrideTypes<AdminSubmissionRow, { merge: false }>()

  if (error) {
    throw createAdminSubmissionsError(
      `Could not load admin submission from Supabase: ${error.message}`
    )
  }

  if (!data) {
    throw createSubmissionNotFoundError()
  }

  return mapAdminSubmission(data)
}