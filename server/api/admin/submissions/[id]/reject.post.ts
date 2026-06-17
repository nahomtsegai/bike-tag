import { runAdminAuditedAction } from '../../../../utils/adminAudit'
import { assertAdminRequestAccess } from '../../../../utils/adminAuth'
import { rejectSubmissionInSupabase } from '../../../../utils/supabaseRejectSubmission'
import { assertValidUuid } from '../../../../utils/uuidValidation'

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

  assertValidUuid(submissionId, 'Submission id')

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
  const { adminUser } = await assertAdminRequestAccess(event)

  const submissionId = getSubmissionId(event)
  const body = await readBody<RejectSubmissionRequestBody>(event)
  const reviewedBy = getReviewedBy(body)
  const rejectionReason = getRejectionReason(body)

  const rejectionResult = await runAdminAuditedAction({
    event,
    action: 'submission.reject',
    actor: adminUser,
    targetType: 'submission',
    targetId: submissionId,
    metadata: {
      reviewedBy,
      rejectionReason
    },
    execute: () =>
      rejectSubmissionInSupabase({
        submissionId,
        reviewedBy,
        rejectionReason
      })
  })

  return {
    success: true,
    message: 'Submission rejected.',
    submissionId: rejectionResult.submissionId,
    status: 'rejected'
  }
})
