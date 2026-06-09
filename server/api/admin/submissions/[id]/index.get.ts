import { assertAdminRequestAccess } from '../../../../utils/adminAuth'
import { fetchAdminSubmissionByIdFromSupabase } from '../../../../utils/supabaseAdminSubmissions'
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
  await assertAdminRequestAccess(event)

  const submissionId = getSubmissionId(event)
  const submission = await fetchAdminSubmissionByIdFromSupabase(submissionId)

  return {
    success: true,
    submission
  }
})