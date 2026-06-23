import {
  getHeader,
  readBody,
  readFormData,
  type H3Event
} from 'h3'

import {
  deleteBikeTagPhotos,
  uploadBikeTagPhoto
} from './supabaseStorage'

export type AdminTagPhotoRequestBody = {
  title?: string
  clue?: string
  imageUrl?: string
  hiddenLocationMapUrl?: string
  confirmation?: string
}

type UploadedPhotoFile = {
  name: string
  type: string
  size: number
  arrayBuffer: () => Promise<ArrayBuffer>
}

type UploadedAdminTagPhoto = Awaited<
  ReturnType<typeof uploadBikeTagPhoto>
>

const isMultipartRequest = (event: H3Event) => {
  const contentType = getHeader(event, 'content-type') ?? ''
  return contentType.includes('multipart/form-data')
}

const getOptionalString = (value: FormDataEntryValue | null) => {
  return typeof value === 'string' ? value : undefined
}

const isUploadedPhotoFile = (value: unknown): value is UploadedPhotoFile => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const file = value as Partial<UploadedPhotoFile>

  return (
    typeof file.name === 'string' &&
    typeof file.type === 'string' &&
    typeof file.size === 'number' &&
    typeof file.arrayBuffer === 'function'
  )
}

export const readAdminTagPhotoRequest = async (event: H3Event) => {
  if (!isMultipartRequest(event)) {
    return {
      body: await readBody<AdminTagPhotoRequestBody>(event),
      uploadedPhoto: null as UploadedAdminTagPhoto | null
    }
  }

  const formData = await readFormData(event)
  const photo = formData.get('photo')
  const body: AdminTagPhotoRequestBody = {
    title: getOptionalString(formData.get('title')),
    clue: getOptionalString(formData.get('clue')),
    imageUrl: getOptionalString(formData.get('imageUrl')),
    hiddenLocationMapUrl: getOptionalString(
      formData.get('hiddenLocationMapUrl')
    ),
    confirmation: getOptionalString(formData.get('confirmation'))
  }

  if (!isUploadedPhotoFile(photo) || photo.size <= 0) {
    return {
      body,
      uploadedPhoto: null as UploadedAdminTagPhoto | null
    }
  }

  const uploadedPhoto = await uploadBikeTagPhoto({
    fileBuffer: new Uint8Array(await photo.arrayBuffer()),
    fileName: photo.name,
    mimeType: photo.type,
    photoType: 'tag_photo'
  })

  return {
    body,
    uploadedPhoto
  }
}

export const getAdminTagPhotoUrl = ({
  imageUrl,
  uploadedPhoto
}: {
  imageUrl: unknown
  uploadedPhoto: UploadedAdminTagPhoto | null
}) => {
  return uploadedPhoto?.publicUrl ?? imageUrl
}

export const cleanupUploadedAdminTagPhoto = async (
  uploadedPhoto: UploadedAdminTagPhoto | null
) => {
  if (!uploadedPhoto) {
    return
  }

  try {
    await deleteBikeTagPhotos([uploadedPhoto.storagePath])
  } catch (error) {
    console.error('Could not clean up uploaded admin tag photo.', {
      storagePath: uploadedPhoto.storagePath,
      error
    })
  }
}
