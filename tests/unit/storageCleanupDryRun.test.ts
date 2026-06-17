import { describe, expect, it } from 'vitest'

import { findStorageCleanupCandidates } from '../../server/utils/storageCleanupDryRun'

const now = new Date('2026-06-17T12:00:00.000Z')

const file = (
  path: string,
  createdAt: string | null,
  bucket = 'bike_tag_photos'
) => ({ bucket, path, createdAt, sizeBytes: 100 })

describe('storage cleanup dry run', () => {
  it('preserves old referenced files', () => {
    const result = findStorageCleanupCandidates({
      files: [file('tags/current/photo.jpg', '2026-05-01T00:00:00.000Z')],
      referencedKeys: new Set(['bike_tag_photos:tags/current/photo.jpg']),
      gracePeriodDays: 7,
      now
    })

    expect(result.candidates).toEqual([])
  })

  it('preserves recent unreferenced files', () => {
    const result = findStorageCleanupCandidates({
      files: [file('submissions/recent/photo.jpg', '2026-06-15T00:00:00.000Z')],
      referencedKeys: new Set(),
      gracePeriodDays: 7,
      now
    })

    expect(result.candidates).toEqual([])
    expect(result.skippedRecentFileCount).toBe(1)
  })

  it('reports old unreferenced files without deleting them', () => {
    const result = findStorageCleanupCandidates({
      files: [
        file('tags/unreferenced/photo.jpg', '2026-05-01T00:00:00.000Z'),
        file(
          'submissions/unreferenced/photo.jpg',
          '2026-06-01T00:00:00.000Z',
          'bike_tag_pending_photos'
        )
      ],
      referencedKeys: new Set(),
      gracePeriodDays: 7,
      now
    })

    expect(result.candidates.map(({ bucket, path }) => ({ bucket, path }))).toEqual([
      {
        bucket: 'bike_tag_photos',
        path: 'tags/unreferenced/photo.jpg'
      },
      {
        bucket: 'bike_tag_pending_photos',
        path: 'submissions/unreferenced/photo.jpg'
      }
    ])
  })

  it('skips files without a trustworthy timestamp', () => {
    const result = findStorageCleanupCandidates({
      files: [file('tags/unknown/photo.jpg', null)],
      referencedKeys: new Set(),
      gracePeriodDays: 7,
      now
    })

    expect(result.candidates).toEqual([])
    expect(result.skippedMissingTimestampCount).toBe(1)
  })
})
