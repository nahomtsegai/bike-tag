import {
  allowedImageFileTypesLabel,
  isAllowedImageMimeTypeAndExtension,
  isAllowedSourceImageSize,
  maxCombinedSubmitPhotoSizeInBytes,
  maxCombinedSubmitPhotoSizeLabel,
  maxSourceImageFileSizeLabel
} from '~~/shared/utils/imageValidation'
import { compressImageFileToMaxSize } from './imageCompression'

export const adminTagPhotoAccept = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.heic',
  '.heif'
].join(',')

export type AdminTagPhotoRequestInput = {
  title: string
  clue: string
  imageUrl: string
  hiddenLocationMapUrl: string
  confirmation?: string
  photoFile?: File | null
}

export const validateAdminTagPhotoFile = (
  file: Pick<File, 'name' | 'type' | 'size'>
) => {
  if (!isAllowedImageMimeTypeAndExtension(file.type, file.name)) {
    throw new Error(`Photo must be a ${allowedImageFileTypesLabel} image.`)
  }

  if (!isAllowedSourceImageSize(file.size)) {
    throw new Error(`Photo must be smaller than ${maxSourceImageFileSizeLabel}.`)
  }
}

export const prepareAdminTagPhotoFile = async (file: File) => {
  validateAdminTagPhotoFile(file)

  let preparedFile: File

  try {
    preparedFile = await compressImageFileToMaxSize(
      file,
      maxCombinedSubmitPhotoSizeInBytes
    )
  } catch {
    throw new Error(
      'The selected photo could not be processed. Try a JPG, PNG, or WebP version instead.'
    )
  }

  if (
    !isAllowedImageMimeTypeAndExtension(
      preparedFile.type,
      preparedFile.name
    )
  ) {
    throw new Error(`Photo must be a ${allowedImageFileTypesLabel} image.`)
  }

  if (preparedFile.size > maxCombinedSubmitPhotoSizeInBytes) {
    throw new Error(
      `The selected photo could not be reduced below ${maxCombinedSubmitPhotoSizeLabel}.`
    )
  }

  return preparedFile
}

export const createAdminTagRequestBody = (
  input: AdminTagPhotoRequestInput
) => {
  const jsonBody = {
    title: input.title,
    clue: input.clue,
    imageUrl: input.imageUrl,
    hiddenLocationMapUrl: input.hiddenLocationMapUrl,
    ...(input.confirmation === undefined
      ? {}
      : { confirmation: input.confirmation })
  }

  if (!input.photoFile) {
    return jsonBody
  }

  const formData = new FormData()

  formData.append('title', input.title)
  formData.append('clue', input.clue)
  formData.append('imageUrl', input.imageUrl)
  formData.append('hiddenLocationMapUrl', input.hiddenLocationMapUrl)

  if (input.confirmation !== undefined) {
    formData.append('confirmation', input.confirmation)
  }

  formData.append('photo', input.photoFile)

  return formData
}
