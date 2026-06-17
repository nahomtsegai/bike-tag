import { useRequestEvent } from 'nuxt/app'
import { getHeader } from 'h3'
import {
  activeTagChangedStatusMessage,
  expectedActiveTagIdHeaderName
} from '~~/shared/utils/submitActiveTag'
import { createSupabaseServerClient } from './supabase'
import { assertValidUuid } from './uuidValidation'

type CreatePendingSubmissionInput = {
  clientSubmissionId: string
  expectedActiveTagId?: string
  riderName: string
  foundLocationMapUrl: string
  matchPhotoStoragePath: string
  nextTitle: string
  nextClue: string
  nextHiddenLocationMapUrl: string
  nextTagPhotoStoragePath: string
  foundLatitude: number | null
  foundLongitude: number | null
  foundLocationAccuracyMeters: number | null
  foundLocationCapturedAt: string | null
  nextHiddenLatitude: number | null
  nextHiddenLongitude: number | null
  nextHiddenLocationAccuracyMeters: number | null
  nextHiddenLocationCapturedAt: string | null
}

type CreatePendingSubmissionRpcResponse = {
  submission_id: string
  active_tag_id: string
  was_created?: boolean
}

const pendingSubmissionValidationErrorMessages = new Set([
  'Client submission ID is required.',
  'Expected active tag ID is required.',
  'Rider name is required.',
  'Found location map link is required.',
  'Matching photo storage path is required.',
  'Next tag title is required.',
  'Next tag clue is required.',
  'Hidden location map link is required.',
  'Next tag photo storage path is required.'
])

const createPendingSubmissionError = (message: string) => {
  return createError({
    statusCode: 500,
    statusMessage: message
  })
}

const createPendingSubmissionBadRequestError = (message: string) => {
  return createError({
    statusCode: 400,
    statusMessage: message
  })
}

const createPendingSubmissionConflictError = (message: string) => {
  return createError({
    statusCode: 409,
    statusMessage: message
  })
}

const validateExpectedActiveTagId = (expectedActiveTagId: string) => {
  const normalizedExpectedActiveTagId = expectedActiveTagId.trim()

  if (!normalizedExpectedActiveTagId) {
    throw createPendingSubmissionBadRequestError(
      'Expected active tag ID is required.'
    )
  }

  assertValidUuid(normalizedExpectedActiveTagId, 'Expected active tag ID')

  return normalizedExpectedActiveTagId
}

const resolveExpectedActiveTagId = (expectedActiveTagId?: string) => {
  if (expectedActiveTagId !== undefined) {
    return validateExpectedActiveTagId(expectedActiveTagId)
  }

  const requestEvent = useRequestEvent()

  if (!requestEvent) {
    throw createPendingSubmissionError(
      'Could not read the expected active tag from the request.'
    )
  }

  const requestHeaderValue = getHeader(
    requestEvent,
    expectedActiveTagIdHeaderName
  )

  return validateExpectedActiveTagId(requestHeaderValue ?? '')
}

const createMappedPendingSubmissionError = (errorMessage: string) => {
  if (pendingSubmissionValidationErrorMessages.has(errorMessage)) {
    return createPendingSubmissionBadRequestError(errorMessage)
  }

  if (
    errorMessage === 'ACTIVE_TAG_CHANGED' ||
    errorMessage === 'IDEMPOTENT_SUBMISSION_TAG_MISMATCH'
  ) {
    return createPendingSubmissionConflictError(activeTagChangedStatusMessage)
  }

  if (errorMessage === 'No active tag found.') {
    return createPendingSubmissionConflictError(
      'There is no active Bike Tag to submit against yet.'
    )
  }

  return createPendingSubmissionError(
    `Could not create pending submission in Supabase: ${errorMessage}`
  )
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
    typeof value.active_tag_id === 'string' &&
    (!('was_created' in value) || typeof value.was_created === 'boolean')
  )
}

export const createPendingSubmissionInSupabase = async ({
  clientSubmissionId,
  expectedActiveTagId,
  riderName,
  foundLocationMapUrl,
  matchPhotoStoragePath,
  nextTitle,
  nextClue,
  nextHiddenLocationMapUrl,
  nextTagPhotoStoragePath,
  foundLatitude,
  foundLongitude,
  foundLocationAccuracyMeters,
  foundLocationCapturedAt,
  nextHiddenLatitude,
  nextHiddenLongitude,
  nextHiddenLocationAccuracyMeters,
  nextHiddenLocationCapturedAt
}: CreatePendingSubmissionInput) => {
  const supabase = createSupabaseServerClient()
  const resolvedExpectedActiveTagId = resolveExpectedActiveTagId(
    expectedActiveTagId
  )

  const { data, error } = await supabase.rpc(
    'create_tag_bound_idempotent_private_pending_submission',
    {
      p_client_submission_id: clientSubmissionId,
      p_expected_active_tag_id: resolvedExpectedActiveTagId,
      p_rider_name: riderName,
      p_found_location_map_url: foundLocationMapUrl,
      p_match_photo_storage_path: matchPhotoStoragePath,
      p_next_title: nextTitle,
      p_next_clue: nextClue,
      p_next_hidden_location_map_url: nextHiddenLocationMapUrl,
      p_next_tag_photo_storage_path: nextTagPhotoStoragePath,
      p_found_latitude: foundLatitude,
      p_found_longitude: foundLongitude,
      p_found_location_accuracy_meters: foundLocationAccuracyMeters,
      p_found_location_captured_at: foundLocationCapturedAt,
      p_next_hidden_latitude: nextHiddenLatitude,
      p_next_hidden_longitude: nextHiddenLongitude,
      p_next_hidden_location_accuracy_meters:
        nextHiddenLocationAccuracyMeters,
      p_next_hidden_location_captured_at: nextHiddenLocationCapturedAt
    }
  )

  if (error) {
    throw createMappedPendingSubmissionError(error.message)
  }

  if (!Array.isArray(data)) {
    throw createPendingSubmissionError(
      'Supabase pending submission function returned an unexpected response.'
    )
  }

  const pendingSubmissionResult = data[0]

  if (!pendingSubmissionResult) {
    throw createPendingSubmissionConflictError(
      'There is no active Bike Tag to submit against yet.'
    )
  }

  if (!isCreatePendingSubmissionRpcResponse(pendingSubmissionResult)) {
    throw createPendingSubmissionError(
      'Supabase pending submission function did not return a valid result.'
    )
  }

  return {
    submissionId: pendingSubmissionResult.submission_id,
    activeTagId: pendingSubmissionResult.active_tag_id,
    wasCreated: pendingSubmissionResult.was_created ?? true
  }
}
