import {
  doesImageContentMatchMimeType,
  isAllowedImageMimeType,
  isAllowedImageMimeTypeAndExtension,
  isAllowedImageSize
} from '~~/shared/utils/imageValidation'
import type { PhotoInput } from './photoStorageTypes'

export const assertValidPhotoUpload = ({
  fileBuffer,
  fileName,
  mimeType
}: PhotoInput) => {
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

  if (!doesImageContentMatchMimeType(mimeType, fileBuffer)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Photo contents do not match the declared image type.'
    })
  }
}
