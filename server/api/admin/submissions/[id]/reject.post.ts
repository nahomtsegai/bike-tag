import { assertAdminAccess } from '../../../../utils/adminAuth'
import { rejectSubmissionInSupabase } from '../../../../utils/supabaseRejectSubmission'

type RejectSubmissionRequestBody = {
  reviewedBy?: string
  rejectionReason?: string
}

const maxReviewedByLength = 80
const maxRejectionReasonLength = 500

const createRejectionError = (message: string) => {
  return createError({
    statusCode: 400,
    statusMessage: message
  })
}

const getSubmissionId = (event: Parameters<typeof getRouterParam>[0]) => {
  const submissionId = getRouterParam(event, 'id')

  if (!submissionId) {
    throw createRejectionError('Submission id is required.')
  }

  return submissionId
}

const getReviewedBy = (body: RejectSubmissionRequestBody) => {
  if (typeof body.reviewedBy !== 'string' || !body.reviewedBy.trim()) {
    throw createRejectionError('Reviewer is required.')
  }

  const reviewedBy = body.reviewedBy.trim()

  if (reviewedBy.length > maxReviewedByLength) {
    throw createRejectionError('Reviewer is too long.')
  }

  return reviewedBy
}

const getRejectionReason = (body: RejectSubmissionRequestBody) => {
  if (body.rejectionReason === undefined || body.rejectionReason === null) {
    return undefined
  }

  if (typeof body.rejectionReason !== 'string') {
    throw createRejectionError('Rejection reason is invalid.')
  }

  const rejectionReason = body.rejectionReason.trim()

  if (!rejectionReason) {
    return undefined
  }

  if (rejectionReason.length > maxRejectionReasonLength) {
    throw createRejectionError('Rejection reason is too long.')
  }

  return rejectionReason
}

export default defineEventHandler(async (event) => {
  assertAdminAccess(event)

  const submissionId = getSubmissionId(event)
  const body = await readBody<RejectSubmissionRequestBody>(event)
  const reviewedBy = getReviewedBy(body)
  const rejectionReason = getRejectionReason(body)

  const rejectionResult = await rejectSubmissionInSupabase({
    submissionId,
    reviewedBy,
    rejectionReason
  })

  return {
    success: true,
    message: 'Submission rejected.',
    submissionId: rejectionResult.submissionId,
    status: 'rejected'
  }
})