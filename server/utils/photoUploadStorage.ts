import { sanitizeUploadedImage, sanitizedImageMimeType } from './imageSanitization'
import {
  createSafeStoragePath,
  getPendingStorageBucket,
  getPublicStorageBucket
} from './photoStorageConfig'
import { uploadPhotoToBucket } from './photoStorageIo'
import type {
  PendingPhotoInput,
  PublicPhotoInput
} from './photoStorageTypes'
import { assertValidPhotoUpload } from './photoStorageValidation'
import { createSupabaseServerClient } from './supabase'

export const uploadBikeTagPhoto = async (input: PublicPhotoInput) => {
  assertValidPhotoUpload(input)

  const sanitizedPhoto = await sanitizeUploadedImage({
    fileBuffer: input.fileBuffer
  })
  const storageBucket = getPublicStorageBucket()
  const storagePath = createSafeStoragePath({
    folder: 'tags',
    ownerId: input.tagId,
    photoType: input.photoType,
    fileName: `${input.fileName}.webp`,
    mimeType: sanitizedImageMimeType
  })

  await uploadPhotoToBucket({
    storageBucket,
    storagePath,
    fileBuffer: sanitizedPhoto.fileBuffer,
    mimeType: sanitizedPhoto.mimeType
  })

  const { data } = createSupabaseServerClient().storage
    .from(storageBucket)
    .getPublicUrl(storagePath)

  return {
    storageBucket,
    storagePath,
    publicUrl: data.publicUrl
  }
}

export const uploadPendingBikeTagPhoto = async (
  input: PendingPhotoInput
) => {
  assertValidPhotoUpload(input)

  const sanitizedPhoto = await sanitizeUploadedImage({
    fileBuffer: input.fileBuffer
  })
  const storageBucket = getPendingStorageBucket()
  const storagePath = createSafeStoragePath({
    folder: 'submissions',
    ownerId: input.submissionGroupId,
    photoType: input.photoType,
    fileName: `${input.fileName}.webp`,
    mimeType: sanitizedImageMimeType
  })

  await uploadPhotoToBucket({
    storageBucket,
    storagePath,
    fileBuffer: sanitizedPhoto.fileBuffer,
    mimeType: sanitizedPhoto.mimeType
  })

  return {
    storageBucket,
    storagePath
  }
}
