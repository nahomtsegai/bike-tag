import { createSupabaseServerClient } from './supabase'

type CreatePendingSubmissionInput = {
  riderName: string
  foundLocationMapUrl: string
  matchPhotoUrl: string
  nextTitle: string
  nextClue: string
  nextHiddenLocationMapUrl: string
  nextTagPhotoUrl: string
  foundLatitude: number
  foundLongitude: number
  foundLocationAccuracyMeters: number
  foundLocationCapturedAt: string
}

type CreatePendingSubmissionRpcResponse = {
  submission_id: string
  active_tag_id: string
}

const createPendingSubmissionError = (message: string) => {
  return createError({
    statusCode: 500,
    statusMessage: message
  })
}

const isCreatePendingSubmissionRpcResponse = (
  value: unknown
): value is CreatePendingSubmissionRpcResponse => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'submission_id' in value &&
    typeof value.submission_id === 'string' &&
    'active_tag_id' in value &&
    typeof value.active_tag_id === 'string'
  )
}

export const createPendingSubmissionInSupabase = async ({
  riderName,
  foundLocationMapUrl,
  matchPhotoUrl,
  nextTitle,
  nextClue,
  nextHiddenLocationMapUrl,
  nextTagPhotoUrl,
  foundLatitude,
  foundLongitude,
  foundLocationAccuracyMeters,
  foundLocationCapturedAt
}: CreatePendingSubmissionInput) => {
  const supabase = createSupabaseServerClient()

  const { data, error } = await supabase.rpc('create_pending_submission', {
    p_rider_name: riderName,
    p_found_location_map_url: foundLocationMapUrl,
    p_match_photo_url: matchPhotoUrl,
    p_next_title: nextTitle,
    p_next_clue: nextClue,
    p_next_hidden_location_map_url: nextHiddenLocationMapUrl,
    p_next_tag_photo_url: nextTagPhotoUrl,
    p_found_latitude: foundLatitude,
    p_found_longitude: foundLongitude,
    p_found_location_accuracy_meters: foundLocationAccuracyMeters,
    p_found_location_captured_at: foundLocationCapturedAt
  })

  if (error) {
    throw createPendingSubmissionError(
      `Could not create pending submission in Supabase: ${error.message}`
    )
  }

  if (!Array.isArray(data)) {
    throw createPendingSubmissionError(
      'Supabase pending submission function returned an unexpected response.'
    )
  }

  const pendingSubmissionResult = data[0]

  if (!isCreatePendingSubmissionRpcResponse(pendingSubmissionResult)) {
    throw createPendingSubmissionError(
      'Supabase pending submission function did not return a valid result.'
    )
  }

  return {
    submissionId: pendingSubmissionResult.submission_id,
    activeTagId: pendingSubmissionResult.active_tag_id
  }
}