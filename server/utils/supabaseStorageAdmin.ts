import {
  getAdminPhotoSignedUrlTtlSeconds,
  getPendingStorageBucket,
  getPublicStorageBucket
} from './photoStorageConfig'
import { createSupabaseServerClient } from './supabase'

export const getStoragePathFromPublicUrl = (
  publicUrl: string,
  storageBucket = getPublicStorageBucket()
) => {
  if (!publicUrl.trim() || !storageBucket.trim()) return ''

  const marker = `/storage/v1/object/public/${storageBucket}/`
  const markerIndex = publicUrl.indexOf(marker)

  if (markerIndex === -1) return ''

  const encodedPath = publicUrl.slice(markerIndex + marker.length)
  return decodeURIComponent(encodedPath.split('?')[0] ?? '')
}

export const createAdminPhotoSignedUrl = async ({
  storagePath,
  expiresInSeconds
}: {
  storagePath: string
  expiresInSeconds?: number
}) => {
  const normalizedPath = storagePath.trim()

  if (!normalizedPath) return ''

  const ttl = expiresInSeconds ?? getAdminPhotoSignedUrlTtlSeconds()

  if (!Number.isInteger(ttl) || ttl <= 0) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Admin photo signed URL lifetime must be a positive integer.'
    })
  }

  const { data, error } = await createSupabaseServerClient().storage
    .from(getPendingStorageBucket())
    .createSignedUrl(normalizedPath, ttl)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Could not create admin photo URL: ${error.message}`
    })
  }

  if (typeof data?.signedUrl !== 'string' || !data.signedUrl.trim()) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase did not return a valid admin photo URL.'
    })
  }

  return data.signedUrl
}

export const resolveAdminPhotoUrl = async ({
  publicUrl,
  storagePath
}: {
  publicUrl: string | null
  storagePath: string | null
}) => {
  if (storagePath?.trim()) {
    return createAdminPhotoSignedUrl({ storagePath })
  }

  return publicUrl?.trim() ?? ''
}
