import { getHeader } from 'h3'

import { runStorageCleanupDryRun } from '../../utils/storageCleanupDryRun'

const assertCronRequestAccess = (event: Parameters<typeof getHeader>[0]) => {
  const cronSecret = process.env.CRON_SECRET?.trim()

  if (!cronSecret) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Scheduled storage cleanup is not configured.'
    })
  }

  if (getHeader(event, 'authorization') !== `Bearer ${cronSecret}`) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Scheduled storage cleanup access is required.'
    })
  }
}

export default defineEventHandler(async (event) => {
  assertCronRequestAccess(event)

  return await runStorageCleanupDryRun()
})
