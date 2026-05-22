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
  status: AdminSubmissionStatus
  rejection_reason: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  created_at: string
  updated_at: string
}

type FetchAdminSubmissionsOptions = {
  status?: AdminSubmissionStatus
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
  'status',
  'rejection_reason',
  'reviewed_at',
  'reviewed_by',
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
    status: submission.status,
    rejectionReason: submission.rejection_reason,
    reviewedAt: submission.reviewed_at,
    reviewedBy: submission.reviewed_by,
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
  limit,
  offset
}: FetchAdminSubmissionsOptions) => {
  const supabase = createSupabaseServerClient()
  const from = offset
  const to = offset + limit - 1

  let query = supabase
    .from('submissions')
    .select(submissionSelectColumns, { count: 'exact' })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error, count } = await query
    .returns<AdminSubmissionRow[]>()
    .order('created_at', { ascending: false })
    .range(from, to)

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
    .returns<AdminSubmissionRow>()
    .maybeSingle()

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