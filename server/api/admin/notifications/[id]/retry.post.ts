import { runAdminAuditedAction } from '../../../../utils/adminAudit'
import { assertAdminRequestAccess } from '../../../../utils/adminAuth'
import { retryFailedSubmissionNotification } from '../../../../utils/submissionNotificationDelivery'
import { assertValidUuid } from '../../../../utils/uuidValidation'

const getAttemptId = (event: Parameters<typeof getRouterParam>[0]) => {
  const attemptId = getRouterParam(event, 'id')

  if (!attemptId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Notification attempt id is required.'
    })
  }

  assertValidUuid(attemptId, 'Notification attempt id')

  return attemptId
}

export default defineEventHandler(async (event) => {
  const { adminUser } = await assertAdminRequestAccess(event)
  const attemptId = getAttemptId(event)

  const result = await runAdminAuditedAction({
    event,
    action: 'notification.retry',
    actor: adminUser,
    targetType: 'notification_attempt',
    targetId: attemptId,
    execute: () => retryFailedSubmissionNotification(attemptId)
  })

  return {
    success: true,
    message: 'Notification retry sent.',
    attemptId: result.attemptId,
    attemptNumber: result.attemptNumber,
    status: result.status
  }
})
