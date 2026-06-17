import { assertAdminRequestAccess } from '../../../utils/adminAuth'
import { runStorageCleanupDryRun } from '../../../utils/storageCleanupDryRun'

export default defineEventHandler(async (event) => {
  await assertAdminRequestAccess(event)

  return await runStorageCleanupDryRun()
})
