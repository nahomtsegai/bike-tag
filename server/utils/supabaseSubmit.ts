import { createSupabaseServerClient } from './supabase'

type SubmitBikeTagToSupabaseInput = {
  riderName: string
  foundLocationMapUrl: string
  matchPhotoUrl: string
  nextTitle: string
  nextClue: string
  nextHiddenLocationMapUrl: string
  nextTagPhotoUrl: string
}

type SubmitBikeTagRpcResponse = {
  found_tag_id: string
  current_tag_id: string
}

const createSupabaseSubmitError = (message: string) => {
  return createError({
    statusCode: 500,
    statusMessage: message
  })
}

const isSubmitBikeTagRpcResponse = (
  value: unknown
): value is SubmitBikeTagRpcResponse => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'found_tag_id' in value &&
    typeof value.found_tag_id === 'string' &&
    'current_tag_id' in value &&
    typeof value.current_tag_id === 'string'
  )
}

export const submitBikeTagToSupabase = async ({
  riderName,
  foundLocationMapUrl,
  matchPhotoUrl,
  nextTitle,
  nextClue,
  nextHiddenLocationMapUrl,
  nextTagPhotoUrl
}: SubmitBikeTagToSupabaseInput) => {
  const supabase = createSupabaseServerClient()

  const { data, error } = await supabase.rpc('submit_bike_tag', {
    p_rider_name: riderName,
    p_found_location_map_url: foundLocationMapUrl,
    p_match_photo_url: matchPhotoUrl,
    p_next_title: nextTitle,
    p_next_clue: nextClue,
    p_next_hidden_location_map_url: nextHiddenLocationMapUrl,
    p_next_tag_photo_url: nextTagPhotoUrl
  })

  if (error) {
    throw createSupabaseSubmitError(
      `Could not submit Bike Tag to Supabase: ${error.message}`
    )
  }

  if (!Array.isArray(data)) {
    throw createSupabaseSubmitError(
      'Supabase submit function returned an unexpected response.'
    )
  }

  const submitResult = data[0]

  if (!isSubmitBikeTagRpcResponse(submitResult)) {
    throw createSupabaseSubmitError(
      'Supabase submit function did not return a valid result.'
    )
  }

  return {
    foundTagId: submitResult.found_tag_id,
    currentTagId: submitResult.current_tag_id
  }
}