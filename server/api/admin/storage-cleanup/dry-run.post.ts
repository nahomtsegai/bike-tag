import { assertAdminRequestAccess } from '../../../utils/adminAuth'
import { runTrackedStorageCleanupDryRun } from '../../../utils/trackedStorageCleanupDryRun'

export default defineEventHandler(async (event) => {
  await assertAdminRequestAccess(event)

  return await runTrackedStorageCleanupDryRun()
})
