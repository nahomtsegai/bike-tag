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

const createApproveSubmissionError = (message: string) => {
  return createError({
    statusCode: 500,
    statusMessage: message
  })
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
    throw createApproveSubmissionError(
      `Could not approve submission in Supabase: ${error.message}`
    )
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