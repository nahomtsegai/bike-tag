import { getFileExtension } from '~~/shared/utils/imageValidation'
import type { PhotoType } from './photoStorageTypes'

const createId = () =>
  globalThis.crypto?.randomUUID?.() ||
  `id_${Date.now()}_${Math.random().toString(36).slice(2)}`

const requiredBucket = (value: unknown, variableName: string) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw createError({
      statusCode: 500,
      statusMessage: `Missing required environment variable: ${variableName}`
    })
  }

  return value.trim()
}

export const getPublicStorageBucket = () =>
  requiredBucket(
    useRuntimeConfig().supabaseStorageBucket,
    'NUXT_SUPABASE_STORAGE_BUCKET'
  )

export const getPendingStorageBucket = () =>
  requiredBucket(
    useRuntimeConfig().supabasePendingStorageBucket,
    'NUXT_SUPABASE_PENDING_STORAGE_BUCKET'
  )

export const getAdminPhotoSignedUrlTtlSeconds = () => {
  const value = Number(useRuntimeConfig().adminPhotoSignedUrlTtlSeconds)

  if (!Number.isInteger(value) || value <= 0) {
    throw createError({
      statusCode: 500,
      statusMessage:
        'NUXT_ADMIN_PHOTO_SIGNED_URL_TTL_SECONDS must be a positive integer.'
    })
  }

  return value
}

const extensionFor = (fileName: string, mimeType: string) =>
  getFileExtension(fileName) ||
  (mimeType === 'image/png'
    ? 'png'
    : mimeType === 'image/webp'
      ? 'webp'
      : 'jpg')

export const createSafeStoragePath = ({
  folder,
  ownerId,
  photoType,
  fileName,
  mimeType
}: {
  folder: 'tags' | 'submissions'
  ownerId?: string
  photoType: PhotoType
  fileName: string
  mimeType: string
}) =>
  `${folder}/${ownerId || createId()}/${photoType}_${createId()}.${extensionFor(
    fileName,
    mimeType
  )}`
