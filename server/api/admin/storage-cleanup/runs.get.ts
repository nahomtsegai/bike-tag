import { getQuery } from 'h3'

import { assertAdminRequestAccess } from '../../../utils/adminAuth'
import {
  getRecentStorageCleanupRuns,
  getStorageCleanupEnvironment
} from '../../../utils/storageCleanupRuns'

export default defineEventHandler(async (event) => {
  await assertAdminRequestAccess(event)

  const query = getQuery(event)
  const requestedLimit = Number(query.limit ?? 30)
  const limit = Number.isFinite(requestedLimit) ? requestedLimit : 30
  const environment = getStorageCleanupEnvironment()
  const runs = await getRecentStorageCleanupRuns({ limit, environment })

  return {
    environment,
    runs
  }
})
