import { assertAdminAccess } from '../../../../utils/adminAuth'
import { fetchAdminSubmissionByIdFromSupabase } from '../../../../utils/supabaseAdminSubmissions'

const getSubmissionId = (event: Parameters<typeof getRouterParam>[0]) => {
  const submissionId = getRouterParam(event, 'id')

  if (!submissionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Submission id is required.'
    })
  }

  return submissionId
}

export default defineEventHandler(async (event) => {
  assertAdminAccess(event)

  const submissionId = getSubmissionId(event)
  const submission = await fetchAdminSubmissionByIdFromSupabase(submissionId)

  return {
    success: true,
    submission
  }
})