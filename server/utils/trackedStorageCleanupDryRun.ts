import { runStorageCleanupDryRun } from './storageCleanupDryRun'
import {
  getStorageCleanupEnvironment,
  recordStorageCleanupRun
} from './storageCleanupRuns'

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message
  if (
    typeof error === 'object' &&
    error !== null &&
    'statusMessage' in error &&
    typeof error.statusMessage === 'string'
  ) {
    return error.statusMessage
  }
  return 'Unknown storage cleanup scan failure.'
}

export const runTrackedStorageCleanupDryRun = async ({
  now = new Date()
}: {
  now?: Date
} = {}) => {
  const startedAt = now.toISOString()
  const environment = getStorageCleanupEnvironment()

  try {
    const result = await runStorageCleanupDryRun({ now })
    const completedAt = new Date().toISOString()

    await recordStorageCleanupRun({
      environment,
      status: 'succeeded',
      mode: 'dry-run',
      gracePeriodDays: result.gracePeriodDays,
      scannedFileCount: result.scannedFileCount,
      referencedFileCount: result.referencedFileCount,
      skippedRecentFileCount: result.skippedRecentFileCount,
      skippedMissingTimestampCount: result.skippedMissingTimestampCount,
      candidateCount: result.candidateCount,
      candidateSizeBytes: result.candidateSizeBytes,
      errorMessage: null,
      startedAt,
      completedAt
    })

    return result
  } catch (error) {
    await recordStorageCleanupRun({
      environment,
      status: 'failed',
      mode: 'dry-run',
      gracePeriodDays: null,
      scannedFileCount: null,
      referencedFileCount: null,
      skippedRecentFileCount: null,
      skippedMissingTimestampCount: null,
      candidateCount: null,
      candidateSizeBytes: null,
      errorMessage: getErrorMessage(error),
      startedAt,
      completedAt: new Date().toISOString()
    })

    throw error
  }
}
