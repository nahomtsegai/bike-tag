import { createSupabaseServerClient } from './supabase'

type RejectSubmissionInput = {
  submissionId: string
  reviewedBy: string
  rejectionReason?: string
}

type RejectSubmissionRpcResponse = {
  submission_id: string
}

const createRejectSubmissionError = (message: string) => {
  return createError({
    statusCode: 500,
    statusMessage: message
  })
}

const isRejectSubmissionRpcResponse = (
  value: unknown
): value is RejectSubmissionRpcResponse => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'submission_id' in value &&
    typeof value.submission_id === 'string'
  )
}

export const rejectSubmissionInSupabase = async ({
  submissionId,
  reviewedBy,
  rejectionReason
}: RejectSubmissionInput) => {
  const supabase = createSupabaseServerClient()

  const { data, error } = await supabase.rpc('reject_submission', {
    p_submission_id: submissionId,
    p_reviewed_by: reviewedBy,
    p_rejection_reason: rejectionReason ?? null
  })

  if (error) {
    throw createRejectSubmissionError(
      `Could not reject submission in Supabase: ${error.message}`
    )
  }

  if (!Array.isArray(data)) {
    throw createRejectSubmissionError(
      'Supabase reject submission function returned an unexpected response.'
    )
  }

  const rejectResult = data[0]

  if (!isRejectSubmissionRpcResponse(rejectResult)) {
    throw createRejectSubmissionError(
      'Supabase reject submission function did not return a valid result.'
    )
  }

  return {
    submissionId: rejectResult.submission_id
  }
}