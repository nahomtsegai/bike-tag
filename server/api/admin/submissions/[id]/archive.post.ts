import { createError, defineEventHandler, getRouterParam } from 'h3'

import { runAdminAuditedAction } from '../../../../utils/adminAudit'
import { assertAdminRequestAccess } from '../../../../utils/adminAuth'
import { archiveApprovedSubmissionInSupabase } from '../../../../utils/supabaseArchiveSubmission'
import { assertValidUuid } from '../../../../utils/uuidValidation'

const getSubmissionId = (event: Parameters<typeof getRouterParam>[0]) => {
  const submissionId = getRouterParam(event, 'id')

  if (!submissionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Submission id is required.'
    })
  }

  assertValidUuid(submissionId, 'Submission id')

  return submissionId
}

export default defineEventHandler(async (event) => {
  const { adminUser } = await assertAdminRequestAccess(event)

  const submissionId = getSubmissionId(event)

  const archiveResult = await runAdminAuditedAction({
    event,
    action: 'submission.archive',
    actor: adminUser,
    targetType: 'submission',
    targetId: submissionId,
    execute: () =>
      archiveApprovedSubmissionInSupabase({
        submissionId
      })
  })

  return {
    success: true,
    submissionId: archiveResult.submissionId,
    archivedAt: archiveResult.archivedAt
  }
})
