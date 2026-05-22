import { assertAdminAccess } from '../../../utils/adminAuth'
import {
  fetchAdminSubmissionsFromSupabase,
  isAdminSubmissionStatus
} from '../../../utils/supabaseAdminSubmissions'

const getSubmissionStatusFilter = (
  event: Parameters<typeof getQuery>[0]
) => {
  const query = getQuery(event)
  const status = query.status

  if (status === undefined || status === null || status === '') {
    return undefined
  }

  if (!isAdminSubmissionStatus(status)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Submission status filter is invalid.'
    })
  }

  return status
}

export default defineEventHandler(async (event) => {
  assertAdminAccess(event)

  const status = getSubmissionStatusFilter(event)
  const submissions = await fetchAdminSubmissionsFromSupabase(status)

  return {
    success: true,
    submissions
  }
})