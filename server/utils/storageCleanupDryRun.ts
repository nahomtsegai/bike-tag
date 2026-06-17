import { getPendingStorageBucket, getPublicStorageBucket } from './photoStorageConfig'
import { createSupabaseServerClient } from './supabase'
import { getStoragePathFromPublicUrl } from './supabaseStorageAdmin'

const storageListPageSize = 100
const millisecondsPerDay = 24 * 60 * 60 * 1000

export type StorageCleanupCandidate = {
  bucket: string
  path: string
  createdAt: string
  ageDays: number
  sizeBytes: number | null
}

export type StorageCleanupDryRunResult = {
  mode: 'dry-run'
  gracePeriodDays: number
  cutoffIso: string
  scannedFileCount: number
  referencedFileCount: number
  skippedRecentFileCount: number
  skippedMissingTimestampCount: number
  candidateCount: number
  candidateSizeBytes: number
  candidates: StorageCleanupCandidate[]
}

type StorageObject = {
  id: string | null
  name: string
  created_at: string | null
  updated_at: string | null
  metadata: Record<string, unknown> | null
}

type SubmissionPhotoReferences = {
  match_photo_url: string | null
  next_tag_photo_url: string | null
  match_photo_storage_path: string | null
  next_tag_photo_storage_path: string | null
}

type TagPhotoReferences = {
  tag_photo_url: string | null
  match_photo_url: string | null
}

type ListedStorageFile = {
  bucket: string
  path: string
  createdAt: string | null
  sizeBytes: number | null
}

const getStorageCleanupGracePeriodDays = () => {
  const value = Number(useRuntimeConfig().storageCleanupGracePeriodDays)

  if (!Number.isInteger(value) || value < 1) {
    throw createError({
      statusCode: 500,
      statusMessage:
        'NUXT_STORAGE_CLEANUP_GRACE_PERIOD_DAYS must be a positive integer.'
    })
  }

  return value
}

const getMetadataSize = (metadata: Record<string, unknown> | null) => {
  const value = metadata?.size
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

const createStorageScanError = (bucket: string, message: string) => {
  return createError({
    statusCode: 500,
    statusMessage: `Could not scan storage bucket ${bucket}: ${message}`
  })
}

const listStorageFolder = async ({
  bucket,
  folder = ''
}: {
  bucket: string
  folder?: string
}): Promise<ListedStorageFile[]> => {
  const supabase = createSupabaseServerClient()
  const files: ListedStorageFile[] = []
  let offset = 0

  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(folder, {
      limit: storageListPageSize,
      offset,
      sortBy: {
        column: 'name',
        order: 'asc'
      }
    })

    if (error) {
      throw createStorageScanError(bucket, error.message)
    }

    const entries = (data ?? []) as StorageObject[]

    for (const entry of entries) {
      const path = folder ? `${folder}/${entry.name}` : entry.name

      if (entry.id === null) {
        files.push(...(await listStorageFolder({ bucket, folder: path })))
        continue
      }

      files.push({
        bucket,
        path,
        createdAt: entry.created_at ?? entry.updated_at,
        sizeBytes: getMetadataSize(entry.metadata)
      })
    }

    if (entries.length < storageListPageSize) {
      break
    }

    offset += storageListPageSize
  }

  return files
}

const loadSubmissionReferences = async () => {
  const { data, error } = await createSupabaseServerClient()
    .from('submissions')
    .select(
      'match_photo_url,next_tag_photo_url,match_photo_storage_path,next_tag_photo_storage_path'
    )
    .overrideTypes<SubmissionPhotoReferences[], { merge: false }>()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Could not load submission photo references: ${error.message}`
    })
  }

  return data ?? []
}

const loadTagReferences = async () => {
  const { data, error } = await createSupabaseServerClient()
    .from('tags')
    .select('tag_photo_url,match_photo_url')
    .overrideTypes<TagPhotoReferences[], { merge: false }>()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Could not load tag photo references: ${error.message}`
    })
  }

  return data ?? []
}

const createReferenceKey = (bucket: string, path: string) => `${bucket}:${path}`

const loadReferencedStorageKeys = async () => {
  const publicBucket = getPublicStorageBucket()
  const pendingBucket = getPendingStorageBucket()
  const [submissions, tags] = await Promise.all([
    loadSubmissionReferences(),
    loadTagReferences()
  ])
  const referencedKeys = new Set<string>()

  for (const submission of submissions) {
    for (const publicUrl of [
      submission.match_photo_url,
      submission.next_tag_photo_url
    ]) {
      const path = getStoragePathFromPublicUrl(publicUrl ?? '', publicBucket)
      if (path) referencedKeys.add(createReferenceKey(publicBucket, path))
    }

    for (const path of [
      submission.match_photo_storage_path,
      submission.next_tag_photo_storage_path
    ]) {
      if (path?.trim()) {
        referencedKeys.add(createReferenceKey(pendingBucket, path.trim()))
      }
    }
  }

  for (const tag of tags) {
    for (const publicUrl of [tag.tag_photo_url, tag.match_photo_url]) {
      const path = getStoragePathFromPublicUrl(publicUrl ?? '', publicBucket)
      if (path) referencedKeys.add(createReferenceKey(publicBucket, path))
    }
  }

  return referencedKeys
}

export const findStorageCleanupCandidates = ({
  files,
  referencedKeys,
  gracePeriodDays,
  now = new Date()
}: {
  files: ListedStorageFile[]
  referencedKeys: Set<string>
  gracePeriodDays: number
  now?: Date
}) => {
  const cutoffTime = now.getTime() - gracePeriodDays * millisecondsPerDay
  const candidates: StorageCleanupCandidate[] = []
  let skippedRecentFileCount = 0
  let skippedMissingTimestampCount = 0

  for (const file of files) {
    if (referencedKeys.has(createReferenceKey(file.bucket, file.path))) {
      continue
    }

    if (!file.createdAt) {
      skippedMissingTimestampCount += 1
      continue
    }

    const createdTime = Date.parse(file.createdAt)

    if (!Number.isFinite(createdTime)) {
      skippedMissingTimestampCount += 1
      continue
    }

    if (createdTime > cutoffTime) {
      skippedRecentFileCount += 1
      continue
    }

    candidates.push({
      bucket: file.bucket,
      path: file.path,
      createdAt: new Date(createdTime).toISOString(),
      ageDays: Math.floor((now.getTime() - createdTime) / millisecondsPerDay),
      sizeBytes: file.sizeBytes
    })
  }

  candidates.sort((left, right) => {
    return left.createdAt.localeCompare(right.createdAt)
  })

  return {
    cutoffIso: new Date(cutoffTime).toISOString(),
    skippedRecentFileCount,
    skippedMissingTimestampCount,
    candidates
  }
}

export const runStorageCleanupDryRun = async ({
  now = new Date()
}: {
  now?: Date
} = {}): Promise<StorageCleanupDryRunResult> => {
  const gracePeriodDays = getStorageCleanupGracePeriodDays()
  const publicBucket = getPublicStorageBucket()
  const pendingBucket = getPendingStorageBucket()
  const [referencedKeys, publicFiles, pendingFiles] = await Promise.all([
    loadReferencedStorageKeys(),
    listStorageFolder({ bucket: publicBucket }),
    listStorageFolder({ bucket: pendingBucket })
  ])
  const files = [...publicFiles, ...pendingFiles]
  const candidateResult = findStorageCleanupCandidates({
    files,
    referencedKeys,
    gracePeriodDays,
    now
  })
  const result: StorageCleanupDryRunResult = {
    mode: 'dry-run',
    gracePeriodDays,
    cutoffIso: candidateResult.cutoffIso,
    scannedFileCount: files.length,
    referencedFileCount: files.filter((file) => {
      return referencedKeys.has(createReferenceKey(file.bucket, file.path))
    }).length,
    skippedRecentFileCount: candidateResult.skippedRecentFileCount,
    skippedMissingTimestampCount:
      candidateResult.skippedMissingTimestampCount,
    candidateCount: candidateResult.candidates.length,
    candidateSizeBytes: candidateResult.candidates.reduce(
      (total, candidate) => total + (candidate.sizeBytes ?? 0),
      0
    ),
    candidates: candidateResult.candidates
  }

  console.info('[storage-cleanup-dry-run]', result)

  return result
}
