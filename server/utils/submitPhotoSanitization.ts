import {
  isAllowedCombinedSubmitPhotoSize,
  maxCombinedSubmitPhotoSizeLabel
} from '~~/shared/utils/imageValidation'
import {
  sanitizeUploadedImage,
  type SanitizedUploadedImage
} from './imageSanitization'

type SubmitPhotoInput = {
  fileBuffer: Uint8Array
  fileName: string
  mimeType: string
}

type SanitizeSubmitPhotosInput = {
  matchPhoto: SubmitPhotoInput
  nextPhoto: SubmitPhotoInput
}

export type SubmitPhotoSanitizationMetadata = {
  matchPhoto: Omit<SanitizedUploadedImage, 'fileBuffer'>
  nextPhoto: Omit<SanitizedUploadedImage, 'fileBuffer'>
}

const getMetadata = ({
  fileBuffer: _fileBuffer,
  ...metadata
}: SanitizedUploadedImage) => metadata

export const sanitizeSubmitPhotos = async ({
  matchPhoto,
  nextPhoto
}: SanitizeSubmitPhotosInput) => {
  // Process sequentially to avoid decoding two large photos into memory at once.
  const sanitizedMatchPhoto = await sanitizeUploadedImage({
    ...matchPhoto,
    displayName: 'Matching photo'
  })
  const sanitizedNextPhoto = await sanitizeUploadedImage({
    ...nextPhoto,
    displayName: 'Next tag photo'
  })

  if (
    !isAllowedCombinedSubmitPhotoSize(
      sanitizedMatchPhoto.outputSize,
      sanitizedNextPhoto.outputSize
    )
  ) {
    const error = new Error(
      `Sanitized submission photos must total no more than ${maxCombinedSubmitPhotoSizeLabel}.`
    ) as Error & { statusCode: number; statusMessage: string }

    error.name = 'SubmitPhotoSanitizationError'
    error.statusCode = 400
    error.statusMessage = error.message

    throw error
  }

  return {
    matchPhoto: {
      fileBuffer: sanitizedMatchPhoto.fileBuffer,
      fileName: sanitizedMatchPhoto.fileName,
      mimeType: sanitizedMatchPhoto.mimeType
    },
    nextPhoto: {
      fileBuffer: sanitizedNextPhoto.fileBuffer,
      fileName: sanitizedNextPhoto.fileName,
      mimeType: sanitizedNextPhoto.mimeType
    },
    metadata: {
      matchPhoto: getMetadata(sanitizedMatchPhoto),
      nextPhoto: getMetadata(sanitizedNextPhoto)
    } satisfies SubmitPhotoSanitizationMetadata
  }
}
