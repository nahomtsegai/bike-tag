import { runAdminAuditedAction } from '../../../../utils/adminAudit'
import { assertAdminRequestAccess } from '../../../../utils/adminAuth'
import { approveSubmissionInSupabase } from '../../../../utils/supabaseApproveSubmission'
import { getSupabaseTagById } from '../../../../utils/supabaseTags'
import { createCurrentTagResponse } from '../../../../utils/tagResponse'
import { assertValidUuid } from '../../../../utils/uuidValidation'

type ApproveSubmissionRequestBody = {
  reviewedBy?: string
}

const maxReviewedByLength = 80

const createApprovalError = (message: string) => {
  return createError({
    statusCode: 400,
    statusMessage: message
  })
}

const getSubmissionId = (event: Parameters<typeof getRouterParam>[0]) => {
  const submissionId = getRouterParam(event, 'id')

  if (!submissionId) {
    throw createApprovalError('Submission id is required.')
  }

  assertValidUuid(submissionId, 'Submission id')

  return submissionId
}

const getReviewedBy = async (event: Parameters<typeof readBody>[0]) => {
  const body = await readBody<ApproveSubmissionRequestBody>(event)

  if (typeof body.reviewedBy !== 'string' || !body.reviewedBy.trim()) {
    throw createApprovalError('Reviewer is required.')
  }

  const reviewedBy = body.reviewedBy.trim()

  if (reviewedBy.length > maxReviewedByLength) {
    throw createApprovalError('Reviewer is too long.')
  }

  return reviewedBy
}

export default defineEventHandler(async (event) => {
  const { adminUser } = await assertAdminRequestAccess(event)

  const submissionId = getSubmissionId(event)
  const reviewedBy = await getReviewedBy(event)

  const approvalResult = await runAdminAuditedAction({
    event,
    action: 'submission.approve',
    actor: adminUser,
    targetType: 'submission',
    targetId: submissionId,
    metadata: {
      reviewedBy
    },
    execute: () =>
      approveSubmissionInSupabase({
        submissionId,
        reviewedBy
      })
  })

  const currentTag = await getSupabaseTagById(approvalResult.currentTagId)

  if (!currentTag) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Could not load current tag after approving submission.'
    })
  }

  return {
    success: true,
    message: 'Submission approved.',
    submissionId: approvalResult.submissionId,
    foundTagId: approvalResult.foundTagId,
    currentTag: createCurrentTagResponse(currentTag)
  }
})
