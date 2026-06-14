import {
  getFileExtension,
  isAllowedImageMimeType,
  isAllowedImageMimeTypeAndExtension,
  isAllowedImageSize
} from '~~/shared/utils/imageValidation'
import { createSupabaseServerClient } from './supabase'

type BikeTagPhotoType = 'tag_photo' | 'match_photo'

type UploadBikeTagPhotoInput = {
  fileBuffer: Uint8Array
  fileName: string
  mimeType: string
  tagId?: string
  photoType: BikeTagPhotoType
}

type UploadPendingBikeTagPhotoInput = {
  fileBuffer: Uint8Array
  fileName: string
  mimeType: string
  submissionGroupId: string
  photoType: BikeTagPhotoType
}

type PromotePendingBikeTagPhotoInput = {
  storagePath: string
  submissionId: string
  photoType: BikeTagPhotoType
}

type CreateAdminPhotoSignedUrlInput = {
  storagePath: string
  expiresInSeconds?: number
}

type ResolveAdminPhotoUrlInput = {
  publicUrl: string | null
  storagePath: string | null
}

const createId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }

  return `id_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

const getRequiredStorageBucket = () => {
  const runtimeConfig = useRuntimeConfig()
  const storageBucket = runtimeConfig.supabaseStorageBucket

  if (typeof storageBucket !== 'string' || !storageBucket.trim()) {
    throw createError({
      statusCode: 500,
      statusMessage:
        'Missing required environment variable: NUXT_SUPABASE_STORAGE_BUCKET'
    })
  }

  return storageBucket.trim()
}

const getRequiredPendingStorageBucket = () => {
  const runtimeConfig = useRuntimeConfig()
  const storageBucket = runtimeConfig.supabasePendingStorageBucket

  if (typeof storageBucket !== 'string' || !storageBucket.trim()) {
    throw createError({
      statusCode: 500,
      statusMessage:
        'Missing required environment variable: NUXT_SUPABASE_PENDING_STORAGE_BUCKET'
    })
  }

  return storageBucket.trim()
}

const getAdminPhotoSignedUrlTtlSeconds = () => {
  const runtimeConfig = useRuntimeConfig()
  const ttlSeconds = Number(runtimeConfig.adminPhotoSignedUrlTtlSeconds)

  if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0) {
    throw createError({
      statusCode: 500,
      statusMessage:
        'NUXT_ADMIN_PHOTO_SIGNED_URL_TTL_SECONDS must be a positive integer.'
    })
  }

  return ttlSeconds
}

const getStorageFileExtension = (fileName: string, mimeType: string) => {
  const extensionFromName = getFileExtension(fileName)

  if (extensionFromName) {
    return extensionFromName
  }

  if (mimeType === 'image/jpeg') {
    return 'jpg'
  }

  if (mimeType === 'image/png') {
    return 'png'
  }

  if (mimeType === 'image/webp') {
    return 'webp'
  }

  return 'jpg'
}

const createSafeStoragePath = ({
  folder,
  ownerId,
  photoType,
  fileName,
  mimeType
}: {
  folder: 'tags' | 'submissions'
  ownerId?: string
  photoType: BikeTagPhotoType
  fileName: string
  mimeType: string
}) => {
  const storageOwnerId = ownerId || createId()
  const fileExtension = getStorageFileExtension(fileName, mimeType)
  const fileId = createId()

  return `${folder}/${storageOwnerId}/${photoType}_${fileId}.${fileExtension}`
}

const assertValidPhotoUpload = ({
  fileBuffer,
  fileName,
  mimeType
}: Pick<UploadBikeTagPhotoInput, 'fileBuffer' | 'fileName' | 'mimeType'>) => {
  if (!isAllowedImageMimeType(mimeType)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Photo must be a jpg, png, or webp image.'
    })
  }

  if (!isAllowedImageMimeTypeAndExtension(mimeType, fileName)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Photo file extension must match the image type.'
    })
  }

  if (!isAllowedImageSize(fileBuffer.byteLength)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Photo must be smaller than 8 MB.'
    })
  }
}

const uploadPhotoToBucket = async ({
  storageBucket,
  storagePath,
  fileBuffer,
  mimeType
}: {
  storageBucket: string
  storagePath: string
  fileBuffer: Uint8Array
  mimeType: string
}) => {
  const supabase = createSupabaseServerClient()
  const { error } = await supabase.storage
    .from(storageBucket)
    .upload(storagePath, fileBuffer, {
      contentType: mimeType,
      upsert: false
    })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Could not upload photo to Supabase Storage: ${error.message}`
    })
  }
}

const deletePhotosFromBucket = async ({
  storageBucket,
  storagePaths,
  errorMessage
}: {
  storageBucket: string
  storagePaths: string[]
  errorMessage: string
}) => {
  const pathsToDelete = storagePaths
    .map((storagePath) => storagePath.trim())
    .filter(Boolean)

  if (!pathsToDelete.length) {
    return
  }

  const supabase = createSupabaseServerClient()
  const { error } = await supabase.storage
    .from(storageBucket)
    .remove(pathsToDelete)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `${errorMessage}: ${error.message}`
    })
  }
}

export const getStoragePathFromPublicUrl = (
  publicUrl: string,
  storageBucket = getRequiredStorageBucket()
) => {
  if (!publicUrl.trim()) {
    return ''
  }

  if (!storageBucket.trim()) {
    return ''
  }

  const publicStoragePathMarker = `/storage/v1/object/public/${storageBucket}/`
  const publicStoragePathMarkerIndex = publicUrl.indexOf(
    publicStoragePathMarker
  )

  if (publicStoragePathMarkerIndex === -1) {
    return ''
  }

  const encodedStoragePath = publicUrl.slice(
    publicStoragePathMarkerIndex + publicStoragePathMarker.length
  )

  const storagePathWithoutQuery = encodedStoragePath.split('?')[0] ?? ''

  return decodeURIComponent(storagePathWithoutQuery)
}

export const createAdminPhotoSignedUrl = async ({
  storagePath,
  expiresInSeconds
}: CreateAdminPhotoSignedUrlInput) => {
  const normalizedStoragePath = storagePath.trim()

  if (!normalizedStoragePath) {
    return ''
  }

  const ttlSeconds = expiresInSeconds ?? getAdminPhotoSignedUrlTtlSeconds()

  if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Admin photo signed URL lifetime must be a positive integer.'
    })
  }

  const supabase = createSupabaseServerClient()
  const storageBucket = getRequiredPendingStorageBucket()
  const { data, error } = await supabase.storage
    .from(storageBucket)
    .createSignedUrl(normalizedStoragePath, ttlSeconds)

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
}: ResolveAdminPhotoUrlInput) => {
  if (storagePath?.trim()) {
    return createAdminPhotoSignedUrl({
      storagePath
    })
  }

  return publicUrl?.trim() ?? ''
}

export const uploadBikeTagPhoto = async ({
  fileBuffer,
  fileName,
  mimeType,
  tagId,
  photoType
}: UploadBikeTagPhotoInput) => {
  assertValidPhotoUpload({
    fileBuffer,
    fileName,
    mimeType
  })

  const storageBucket = getRequiredStorageBucket()
  const storagePath = createSafeStoragePath({
    folder: 'tags',
    ownerId: tagId,
    photoType,
    fileName,
    mimeType
  })

  await uploadPhotoToBucket({
    storageBucket,
    storagePath,
    fileBuffer,
    mimeType
  })

  const supabase = createSupabaseServerClient()
  const { data } = supabase.storage
    .from(storageBucket)
    .getPublicUrl(storagePath)

  return {
    storageBucket,
    storagePath,
    publicUrl: data.publicUrl
  }
}

export const uploadPendingBikeTagPhoto = async ({
  fileBuffer,
  fileName,
  mimeType,
  submissionGroupId,
  photoType
}: UploadPendingBikeTagPhotoInput) => {
  assertValidPhotoUpload({
    fileBuffer,
    fileName,
    mimeType
  })

  const storageBucket = getRequiredPendingStorageBucket()
  const storagePath = createSafeStoragePath({
    folder: 'submissions',
    ownerId: submissionGroupId,
    photoType,
    fileName,
    mimeType
  })

  await uploadPhotoToBucket({
    storageBucket,
    storagePath,
    fileBuffer,
    mimeType
  })

  return {
    storageBucket,
    storagePath
  }
}

export const promotePendingBikeTagPhoto = async ({
  storagePath,
  submissionId,
  photoType
}: PromotePendingBikeTagPhotoInput) => {
  const normalizedStoragePath = storagePath.trim()

  if (!normalizedStoragePath) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Pending photo storage path is required.'
    })
  }

  const pendingStorageBucket = getRequiredPendingStorageBucket()
  const publicStorageBucket = getRequiredStorageBucket()
  const publicStoragePath = createSafeStoragePath({
    folder: 'tags',
    ownerId: submissionId,
    photoType,
    fileName: normalizedStoragePath,
    mimeType: 'image/jpeg'
  })
  const supabase = createSupabaseServerClient()
  const { error } = await supabase.storage
    .from(pendingStorageBucket)
    .copy(normalizedStoragePath, publicStoragePath, {
      destinationBucket: publicStorageBucket
    })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Could not publish pending photo: ${error.message}`
    })
  }

  const { data } = supabase.storage
    .from(publicStorageBucket)
    .getPublicUrl(publicStoragePath)

  if (typeof data?.publicUrl !== 'string' || !data.publicUrl.trim()) {
    try {
      await deletePhotosFromBucket({
        storageBucket: publicStorageBucket,
        storagePaths: [publicStoragePath],
        errorMessage: 'Could not roll back published photo'
      })
    } catch (cleanupError) {
      console.error(
        'Could not roll back a published photo with an invalid public URL.',
        {
          publicStoragePath,
          cleanupError
        }
      )
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase did not return a valid public photo URL.'
    })
  }

  return {
    storageBucket: publicStorageBucket,
    storagePath: publicStoragePath,
    publicUrl: data.publicUrl
  }
}

const hasStoragePaths = (storagePaths: string[]) => {
  return storagePaths.some((storagePath) => storagePath.trim())
}

export const deleteBikeTagPhotos = async (storagePaths: string[]) => {
  if (!hasStoragePaths(storagePaths)) {
    return
  }

  await deletePhotosFromBucket({
    storageBucket: getRequiredStorageBucket(),
    storagePaths,
    errorMessage: 'Could not delete uploaded photos from Supabase Storage'
  })
}

export const deletePendingBikeTagPhotos = async (storagePaths: string[]) => {
  if (!hasStoragePaths(storagePaths)) {
    return
  }

  await deletePhotosFromBucket({
    storageBucket: getRequiredPendingStorageBucket(),
    storagePaths,
    errorMessage: 'Could not delete pending photos from Supabase Storage'
  })
}
