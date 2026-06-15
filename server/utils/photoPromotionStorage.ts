import { sanitizedImageMimeType } from './imageSanitization'
import {
  createSafeStoragePath,
  getPendingStorageBucket,
  getPublicStorageBucket
} from './photoStorageConfig'
import { deletePhotosFromBucket } from './photoStorageIo'
import type { PhotoType } from './photoStorageTypes'
import { createSupabaseServerClient } from './supabase'

export const promotePendingBikeTagPhoto = async ({
  storagePath,
  submissionId,
  photoType
}: {
  storagePath: string
  submissionId: string
  photoType: PhotoType
}) => {
  const normalizedPath = storagePath.trim()

  if (!normalizedPath) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Pending photo storage path is required.'
    })
  }

  const pendingBucket = getPendingStorageBucket()
  const publicBucket = getPublicStorageBucket()
  const publicPath = createSafeStoragePath({
    folder: 'tags',
    ownerId: submissionId,
    photoType,
    fileName: normalizedPath,
    mimeType: sanitizedImageMimeType
  })
  const supabase = createSupabaseServerClient()
  const { error } = await supabase.storage
    .from(pendingBucket)
    .copy(normalizedPath, publicPath, {
      destinationBucket: publicBucket
    })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Could not publish pending photo: ${error.message}`
    })
  }

  const { data } = supabase.storage.from(publicBucket).getPublicUrl(publicPath)

  if (typeof data?.publicUrl !== 'string' || !data.publicUrl.trim()) {
    try {
      await deletePhotosFromBucket({
        storageBucket: publicBucket,
        storagePaths: [publicPath],
        errorMessage: 'Could not roll back published photo'
      })
    } catch (cleanupError) {
      console.error(
        'Could not roll back a published photo with an invalid public URL.',
        { publicPath, cleanupError }
      )
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase did not return a valid public photo URL.'
    })
  }

  return {
    storageBucket: publicBucket,
    storagePath: publicPath,
    publicUrl: data.publicUrl
  }
}

const hasStoragePaths = (storagePaths: string[]) => {
  return storagePaths.some((storagePath) => storagePath.trim())
}

export const deleteBikeTagPhotos = async (storagePaths: string[]) => {
  if (!hasStoragePaths(storagePaths)) return

  await deletePhotosFromBucket({
    storageBucket: getPublicStorageBucket(),
    storagePaths,
    errorMessage: 'Could not delete uploaded photos from Supabase Storage'
  })
}

export const deletePendingBikeTagPhotos = async (storagePaths: string[]) => {
  if (!hasStoragePaths(storagePaths)) return

  await deletePhotosFromBucket({
    storageBucket: getPendingStorageBucket(),
    storagePaths,
    errorMessage: 'Could not delete pending photos from Supabase Storage'
  })
}
