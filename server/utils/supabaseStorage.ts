import {
  getFileExtension,
  isAllowedImageMimeType,
  isAllowedImageMimeTypeAndExtension,
  isAllowedImageSize
} from '../../shared/utils/imageValidation'
import { createSupabaseServerClient } from './supabase'

type UploadBikeTagPhotoInput = {
  fileBuffer: Uint8Array
  fileName: string
  mimeType: string
  tagId?: string
  photoType: 'tag_photo' | 'match_photo'
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

  return storageBucket
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

const createSafeStoragePath = (
  photoType: UploadBikeTagPhotoInput['photoType'],
  fileName: string,
  mimeType: string,
  tagId?: string
) => {
  const storageTagId = tagId || createId()
  const fileExtension = getStorageFileExtension(fileName, mimeType)
  const fileId = createId()

  return `tags/${storageTagId}/${photoType}_${fileId}.${fileExtension}`
}

export const uploadBikeTagPhoto = async ({
  fileBuffer,
  fileName,
  mimeType,
  tagId,
  photoType
}: UploadBikeTagPhotoInput) => {
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

  const supabase = createSupabaseServerClient()
  const storageBucket = getRequiredStorageBucket()
  const storagePath = createSafeStoragePath(photoType, fileName, mimeType, tagId)

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

  const { data } = supabase.storage
    .from(storageBucket)
    .getPublicUrl(storagePath)

  return {
    storageBucket,
    storagePath,
    publicUrl: data.publicUrl
  }
}

export const deleteBikeTagPhotos = async (storagePaths: string[]) => {
  const pathsToDelete = storagePaths.filter(Boolean)

  if (!pathsToDelete.length) {
    return
  }

  const supabase = createSupabaseServerClient()
  const storageBucket = getRequiredStorageBucket()

  const { error } = await supabase.storage
    .from(storageBucket)
    .remove(pathsToDelete)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Could not delete uploaded photos from Supabase Storage: ${error.message}`
    })
  }
}