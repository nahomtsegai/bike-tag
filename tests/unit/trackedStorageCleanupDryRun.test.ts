import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockRunStorageCleanupDryRun, mockRecordStorageCleanupRun } = vi.hoisted(() => ({
  mockRunStorageCleanupDryRun: vi.fn(),
  mockRecordStorageCleanupRun: vi.fn()
}))

vi.mock('../../server/utils/storageCleanupDryRun', () => ({
  runStorageCleanupDryRun: mockRunStorageCleanupDryRun
}))

vi.mock('../../server/utils/storageCleanupRuns', () => ({
  getStorageCleanupEnvironment: () => 'preview',
  recordStorageCleanupRun: mockRecordStorageCleanupRun
}))

import { runTrackedStorageCleanupDryRun } from '../../server/utils/trackedStorageCleanupDryRun'

const now = new Date('2026-06-20T18:30:00.000Z')

const result = {
  mode: 'dry-run' as const,
  gracePeriodDays: 7,
  cutoffIso: '2026-06-13T18:30:00.000Z',
  scannedFileCount: 12,
  referencedFileCount: 8,
  skippedRecentFileCount: 2,
  skippedMissingTimestampCount: 0,
  candidateCount: 2,
  candidateSizeBytes: 2048,
  candidates: []
}

describe('tracked storage cleanup dry run', () => {
  beforeEach(() => {
    mockRunStorageCleanupDryRun.mockReset()
    mockRecordStorageCleanupRun.mockReset()
    mockRecordStorageCleanupRun.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('records aggregate details for a successful scan', async () => {
    mockRunStorageCleanupDryRun.mockResolvedValue(result)

    await expect(runTrackedStorageCleanupDryRun({ now })).resolves.toEqual(result)

    expect(mockRecordStorageCleanupRun).toHaveBeenCalledWith(
      expect.objectContaining({
        environment: 'preview',
        status: 'succeeded',
        mode: 'dry-run',
        scannedFileCount: 12,
        referencedFileCount: 8,
        candidateCount: 2,
        candidateSizeBytes: 2048,
        errorMessage: null,
        startedAt: now.toISOString()
      })
    )
  })

  it('records a failed scan without swallowing the original error', async () => {
    const scanError = new Error('Storage bucket unavailable')
    mockRunStorageCleanupDryRun.mockRejectedValue(scanError)

    await expect(runTrackedStorageCleanupDryRun({ now })).rejects.toBe(scanError)

    expect(mockRecordStorageCleanupRun).toHaveBeenCalledWith(
      expect.objectContaining({
        environment: 'preview',
        status: 'failed',
        candidateCount: null,
        candidateSizeBytes: null,
        errorMessage: 'Storage bucket unavailable',
        startedAt: now.toISOString()
      })
    )
  })
})
