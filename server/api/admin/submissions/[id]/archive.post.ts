import { createError, defineEventHandler, getRouterParam } from 'h3'

import { assertAdminAccess } from '../../../../utils/adminAuth'
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
  assertAdminAccess(event)

  const submissionId = getSubmissionId(event)

  const archiveResult = await archiveApprovedSubmissionInSupabase({
    submissionId
  })

  return {
    success: true,
    submissionId: archiveResult.submissionId,
    archivedAt: archiveResult.archivedAt
  }
})