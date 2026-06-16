import { createSupabaseServerClient } from './supabase'

export const uploadPhotoToBucket = async ({
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
  const { error } = await createSupabaseServerClient().storage
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

export const deletePhotosFromBucket = async ({
  storageBucket,
  storagePaths,
  errorMessage
}: {
  storageBucket: string
  storagePaths: string[]
  errorMessage: string
}) => {
  const paths = storagePaths.map((path) => path.trim()).filter(Boolean)

  if (!paths.length) return

  const { error } = await createSupabaseServerClient().storage
    .from(storageBucket)
    .remove(paths)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `${errorMessage}: ${error.message}`
    })
  }
}
