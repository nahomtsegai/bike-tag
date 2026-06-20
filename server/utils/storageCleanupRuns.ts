import { createSupabaseServerClient } from './supabase'

export type StorageCleanupRunStatus = 'succeeded' | 'failed'

export type StorageCleanupRunSummary = {
  id: string
  environment: string
  status: StorageCleanupRunStatus
  mode: 'dry-run'
  gracePeriodDays: number | null
  scannedFileCount: number | null
  referencedFileCount: number | null
  skippedRecentFileCount: number | null
  skippedMissingTimestampCount: number | null
  candidateCount: number | null
  candidateSizeBytes: number | null
  errorMessage: string | null
  startedAt: string
  completedAt: string
  candidateCountChange: number | null
  candidateSizeBytesChange: number | null
}

type StorageCleanupRunRow = {
  id: string
  environment: string
  status: StorageCleanupRunStatus
  mode: 'dry-run'
  grace_period_days: number | null
  scanned_file_count: number | null
  referenced_file_count: number | null
  skipped_recent_file_count: number | null
  skipped_missing_timestamp_count: number | null
  candidate_count: number | null
  candidate_size_bytes: number | string | null
  error_message: string | null
  started_at: string
  completed_at: string
}

type GlobalWithProcess = typeof globalThis & {
  process?: {
    env?: Record<string, string | undefined>
  }
}

export type StorageCleanupRunRecord = Omit<
  StorageCleanupRunSummary,
  'id' | 'candidateCountChange' | 'candidateSizeBytesChange'
>

const maxErrorMessageLength = 500

export const getStorageCleanupEnvironment = () => {
  const runtimeProcess = (globalThis as GlobalWithProcess).process

  return (
    runtimeProcess?.env?.VERCEL_ENV ??
    runtimeProcess?.env?.NODE_ENV ??
    'unknown'
  )
}

const normalizeInteger = (value: number | string | null) => {
  if (value === null) return null
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? Math.max(0, Math.trunc(numericValue)) : null
}

const mapStorageCleanupRun = (
  row: StorageCleanupRunRow,
  previousSuccessfulRun: StorageCleanupRunRow | null
): StorageCleanupRunSummary => {
  const candidateCount = normalizeInteger(row.candidate_count)
  const candidateSizeBytes = normalizeInteger(row.candidate_size_bytes)
  const previousCandidateCount = normalizeInteger(
    previousSuccessfulRun?.candidate_count ?? null
  )
  const previousCandidateSizeBytes = normalizeInteger(
    previousSuccessfulRun?.candidate_size_bytes ?? null
  )

  return {
    id: row.id,
    environment: row.environment,
    status: row.status,
    mode: row.mode,
    gracePeriodDays: normalizeInteger(row.grace_period_days),
    scannedFileCount: normalizeInteger(row.scanned_file_count),
    referencedFileCount: normalizeInteger(row.referenced_file_count),
    skippedRecentFileCount: normalizeInteger(row.skipped_recent_file_count),
    skippedMissingTimestampCount: normalizeInteger(
      row.skipped_missing_timestamp_count
    ),
    candidateCount,
    candidateSizeBytes,
    errorMessage: row.error_message,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    candidateCountChange:
      row.status === 'succeeded' &&
      candidateCount !== null &&
      previousCandidateCount !== null
        ? candidateCount - previousCandidateCount
        : null,
    candidateSizeBytesChange:
      row.status === 'succeeded' &&
      candidateSizeBytes !== null &&
      previousCandidateSizeBytes !== null
        ? candidateSizeBytes - previousCandidateSizeBytes
        : null
  }
}

export const recordStorageCleanupRun = async (
  record: StorageCleanupRunRecord
) => {
  const { error } = await createSupabaseServerClient()
    .from('storage_cleanup_runs')
    .insert({
      environment: record.environment,
      status: record.status,
      mode: record.mode,
      grace_period_days: record.gracePeriodDays,
      scanned_file_count: record.scannedFileCount,
      referenced_file_count: record.referencedFileCount,
      skipped_recent_file_count: record.skippedRecentFileCount,
      skipped_missing_timestamp_count: record.skippedMissingTimestampCount,
      candidate_count: record.candidateCount,
      candidate_size_bytes: record.candidateSizeBytes,
      error_message: record.errorMessage?.slice(0, maxErrorMessageLength) ?? null,
      started_at: record.startedAt,
      completed_at: record.completedAt
    })

  if (error) {
    console.error('[storage-cleanup-run-record-failed]', error.message)
  }
}

export const getRecentStorageCleanupRuns = async ({
  limit = 30,
  environment = getStorageCleanupEnvironment()
}: {
  limit?: number
  environment?: string
} = {}) => {
  const safeLimit = Math.min(100, Math.max(1, Math.trunc(limit)))
  const { data, error } = await createSupabaseServerClient()
    .from('storage_cleanup_runs')
    .select(
      'id,environment,status,mode,grace_period_days,scanned_file_count,referenced_file_count,skipped_recent_file_count,skipped_missing_timestamp_count,candidate_count,candidate_size_bytes,error_message,started_at,completed_at'
    )
    .eq('environment', environment)
    .order('completed_at', { ascending: false })
    .limit(safeLimit)
    .overrideTypes<StorageCleanupRunRow[], { merge: false }>()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Could not load storage cleanup history: ${error.message}`
    })
  }

  const rows = data ?? []
  let previousSuccessfulRun: StorageCleanupRunRow | null = null
  const reversed = [...rows].reverse()
  const mapped = reversed.map((row) => {
    const summary = mapStorageCleanupRun(row, previousSuccessfulRun)
    if (row.status === 'succeeded') previousSuccessfulRun = row
    return summary
  })

  return mapped.reverse()
}
