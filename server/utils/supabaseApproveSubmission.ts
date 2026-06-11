import { createSupabaseServerClient } from './supabase'

type ApproveSubmissionInput = {
  submissionId: string
  reviewedBy: string
}

type ApproveSubmissionRpcResponse = {
  submission_id: string
  found_tag_id: string
  current_tag_id: string
}

type ApproveSubmissionRpcError = {
  message: string
  code?: string | null
  details?: string | null
  hint?: string | null
}

const approveSubmissionErrorMap = {
  SUBMISSION_ID_REQUIRED: {
    statusCode: 400,
    statusMessage: 'Submission id is required.'
  },
  REVIEWER_REQUIRED: {
    statusCode: 400,
    statusMessage: 'Reviewer is required.'
  },
  SUBMISSION_NOT_FOUND: {
    statusCode: 404,
    statusMessage: 'Submission was not found.'
  },
  SUBMISSION_NOT_PENDING: {
    statusCode: 409,
    statusMessage: 'Submission has already been reviewed.'
  },
  ACTIVE_TAG_NOT_ACTIVE: {
    statusCode: 409,
    statusMessage: 'Related active tag is no longer active.'
  },
  ACTIVE_TAG_UPDATE_FAILED: {
    statusCode: 409,
    statusMessage: 'Could not mark active tag as found.'
  }
} as const

const createApproveSubmissionError = (message: string) => {
  return createError({
    statusCode: 500,
    statusMessage: message
  })
}

const getErrorSearchText = (error: ApproveSubmissionRpcError) => {
  return [error.message, error.details, error.hint]
    .filter((value): value is string => {
      return typeof value === 'string'
    })
    .join(' ')
}

const isUniqueConstraintViolation = (
  error: ApproveSubmissionRpcError,
  constraintName: string
) => {
  return error.code === '23505' && getErrorSearchText(error).includes(
    constraintName
  )
}

const createMappedApproveSubmissionError = (
  error: ApproveSubmissionRpcError
) => {
  if (
    isUniqueConstraintViolation(
      error,
      'one_approved_submission_per_active_tag'
    )
  ) {
    return createError({
      statusCode: 409,
      statusMessage: 'This tag already has an approved submission.'
    })
  }

  if (isUniqueConstraintViolation(error, 'one_active_tag')) {
    return createError({
      statusCode: 409,
      statusMessage: 'Another active tag already exists.'
    })
  }

  const mappedError =
    approveSubmissionErrorMap[
      error.message as keyof typeof approveSubmissionErrorMap
    ]

  if (!mappedError) {
    return createApproveSubmissionError(
      `Could not approve submission in Supabase: ${error.message}`
    )
  }

  return createError(mappedError)
}

const isApproveSubmissionRpcResponse = (
  value: unknown
): value is ApproveSubmissionRpcResponse => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'submission_id' in value &&
    typeof value.submission_id === 'string' &&
    'found_tag_id' in value &&
    typeof value.found_tag_id === 'string' &&
    'current_tag_id' in value &&
    typeof value.current_tag_id === 'string'
  )
}

export const approveSubmissionInSupabase = async ({
  submissionId,
  reviewedBy
}: ApproveSubmissionInput) => {
  const supabase = createSupabaseServerClient()

  const { data, error } = await supabase.rpc('approve_submission', {
    p_submission_id: submissionId,
    p_reviewed_by: reviewedBy
  })

  if (error) {
    throw createMappedApproveSubmissionError(error)
  }

  if (!Array.isArray(data)) {
    throw createApproveSubmissionError(
      'Supabase approve submission function returned an unexpected response.'
    )
  }

  const approveResult = data[0]

  if (!isApproveSubmissionRpcResponse(approveResult)) {
    throw createApproveSubmissionError(
      'Supabase approve submission function did not return a valid result.'
    )
  }

  return {
    submissionId: approveResult.submission_id,
    foundTagId: approveResult.found_tag_id,
    currentTagId: approveResult.current_tag_id
  }
}