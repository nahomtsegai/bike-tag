import { getHeader } from 'h3'

import { runTrackedStorageCleanupDryRun } from '../../utils/trackedStorageCleanupDryRun'

const assertScheduledRequestAccess = (
  event: Parameters<typeof getHeader>[0]
) => {
  const configuredCredential = String(
    useRuntimeConfig().storageCleanupCronCredential ?? ''
  ).trim()
  const suppliedHeader = getHeader(event, 'authorization')?.trim() ?? ''
  const suppliedCredential = suppliedHeader.split(' ').slice(1).join(' ')

  if (!configuredCredential) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Scheduled storage cleanup is not configured.'
    })
  }

  if (suppliedCredential !== configuredCredential) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Scheduled storage cleanup access is required.'
    })
  }
}

export default defineEventHandler(async (event) => {
  assertScheduledRequestAccess(event)

  return await runTrackedStorageCleanupDryRun()
})
