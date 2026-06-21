import { getQuery } from 'h3'

import { assertAdminRequestAccess } from '../../utils/adminAuth'
import {
  getRecentSubmissionNotificationAttempts,
  getSubmissionNotificationEnvironment,
  type SubmissionNotificationAttemptStatus
} from '../../utils/submissionNotificationDelivery'

const isNotificationStatus = (
  value: unknown
): value is SubmissionNotificationAttemptStatus => {
  return value === 'pending' || value === 'sent' || value === 'failed'
}

export default defineEventHandler(async (event) => {
  await assertAdminRequestAccess(event)

  const query = getQuery(event)
  const requestedLimit = Number(query.limit ?? 50)
  const limit = Number.isFinite(requestedLimit) ? requestedLimit : 50
  const status = isNotificationStatus(query.status) ? query.status : undefined
  const environment = getSubmissionNotificationEnvironment()
  const attempts = await getRecentSubmissionNotificationAttempts({
    limit,
    status,
    environment
  })

  return {
    environment,
    attempts
  }
})
