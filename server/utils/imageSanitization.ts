import sharp from 'sharp'
import { isAllowedImageSize } from '~~/shared/utils/imageValidation'

export const sanitizedImageMimeType = 'image/webp'
export const sanitizedImageExtension = 'webp'
export const maxSanitizedImageDimension = 2400
export const maxDecodedImagePixels = 40_000_000
export const sanitizedImageQuality = 82

type SanitizeUploadedImageInput = {
  fileBuffer: Uint8Array
}

export type SanitizedUploadedImage = {
  fileBuffer: Uint8Array
  mimeType: typeof sanitizedImageMimeType
  fileExtension: typeof sanitizedImageExtension
  width: number
  height: number
  originalSizeInBytes: number
  sanitizedSizeInBytes: number
}

const createInvalidImageError = (statusMessage: string) => {
  return createError({
    statusCode: 400,
    statusMessage
  })
}

export const sanitizeUploadedImage = async ({
  fileBuffer
}: SanitizeUploadedImageInput): Promise<SanitizedUploadedImage> => {
  try {
    const image = sharp(fileBuffer, {
      failOn: 'error',
      limitInputPixels: maxDecodedImagePixels,
      sequentialRead: true
    })
    const metadata = await image.metadata()

    if (!metadata.width || !metadata.height) {
      throw createInvalidImageError(
        'Photo dimensions could not be determined.'
      )
    }

    const { data, info } = await image
      .rotate()
      .resize({
        width: maxSanitizedImageDimension,
        height: maxSanitizedImageDimension,
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({
        quality: sanitizedImageQuality,
        effort: 4,
        smartSubsample: true
      })
      .toBuffer({ resolveWithObject: true })

    if (!info.width || !info.height || !data.byteLength) {
      throw createInvalidImageError('Photo processing produced an invalid image.')
    }

    if (!isAllowedImageSize(data.byteLength)) {
      throw createInvalidImageError(
        'Processed photo must be smaller than 8 MB.'
      )
    }

    return {
      fileBuffer: new Uint8Array(data),
      mimeType: sanitizedImageMimeType,
      fileExtension: sanitizedImageExtension,
      width: info.width,
      height: info.height,
      originalSizeInBytes: fileBuffer.byteLength,
      sanitizedSizeInBytes: data.byteLength
    }
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      error.statusCode === 400
    ) {
      throw error
    }

    throw createInvalidImageError(
      'Photo could not be decoded as a valid JPG, PNG, or WebP image.'
    )
  }
}
