import sharp from 'sharp'
import {
  isAllowedImageMimeType,
  isAllowedImageSize
} from '~~/shared/utils/imageValidation'

export const defaultSanitizedImageMaxDimension = 1600
export const defaultSanitizedImageJpegQuality = 75
export const defaultSanitizedImageMaxInputPixels = 40_000_000

const allowedSharpFormatsByMimeType = {
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp'
} as const

export class ImageSanitizationError extends Error {
  readonly statusCode = 400
  readonly statusMessage: string

  constructor(message: string) {
    super(message)
    this.name = 'ImageSanitizationError'
    this.statusMessage = message
  }
}

type SanitizeUploadedImageInput = {
  fileBuffer: Uint8Array
  fileName: string
  mimeType: string
  displayName: string
  maxDimension?: number
  jpegQuality?: number
  maxInputPixels?: number
}

export type SanitizedUploadedImage = {
  fileBuffer: Uint8Array
  fileName: string
  mimeType: 'image/jpeg'
  sourceFormat: 'jpeg' | 'png' | 'webp'
  sourceWidth: number
  sourceHeight: number
  sourceSize: number
  sourceHadMetadata: boolean
  outputWidth: number
  outputHeight: number
  outputSize: number
}

const getSanitizedFileName = (fileName: string) => {
  const baseName = fileName
    .replace(/\.[^/.]+$/, '')
    .trim()
    .replace(/[^a-z0-9_-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

  return `${baseName || 'bike-tag-photo'}-sanitized.jpg`
}

const assertPositiveInteger = (
  value: number,
  displayName: string
) => {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${displayName} must be a positive integer.`)
  }
}

const assertValidJpegQuality = (quality: number) => {
  if (!Number.isInteger(quality) || quality < 1 || quality > 100) {
    throw new Error('JPEG quality must be an integer between 1 and 100.')
  }
}

const hasEmbeddedMetadata = (metadata: Awaited<ReturnType<ReturnType<typeof sharp>['metadata']>>) => {
  const metadataRecord = metadata as unknown as Record<string, unknown>

  return Boolean(
    metadata.exif ||
      metadata.icc ||
      metadata.xmp ||
      metadata.iptc ||
      metadataRecord.tifftagPhotoshop ||
      metadataRecord.comments
  )
}

const createClientImageError = (
  displayName: string,
  message: string
) => {
  return new ImageSanitizationError(`${displayName} ${message}`)
}

export const sanitizeUploadedImage = async ({
  fileBuffer,
  fileName,
  mimeType,
  displayName,
  maxDimension = defaultSanitizedImageMaxDimension,
  jpegQuality = defaultSanitizedImageJpegQuality,
  maxInputPixels = defaultSanitizedImageMaxInputPixels
}: SanitizeUploadedImageInput): Promise<SanitizedUploadedImage> => {
  assertPositiveInteger(maxDimension, 'Maximum image dimension')
  assertPositiveInteger(maxInputPixels, 'Maximum input pixel count')
  assertValidJpegQuality(jpegQuality)

  if (!isAllowedImageMimeType(mimeType)) {
    throw createClientImageError(
      displayName,
      'must be a jpg, png, or webp image.'
    )
  }

  if (!fileBuffer.byteLength) {
    throw createClientImageError(displayName, 'cannot be empty.')
  }

  const expectedFormat = allowedSharpFormatsByMimeType[
    mimeType as keyof typeof allowedSharpFormatsByMimeType
  ]

  try {
    const image = sharp(Buffer.from(fileBuffer), {
      animated: false,
      failOn: 'error',
      limitInputPixels: maxInputPixels,
      sequentialRead: true
    })
    const metadata = await image.metadata()

    if (metadata.format !== expectedFormat) {
      throw createClientImageError(
        displayName,
        'content must match the declared image type.'
      )
    }

    if (!metadata.width || !metadata.height) {
      throw createClientImageError(displayName, 'has invalid dimensions.')
    }

    if ((metadata.pages ?? 1) > 1) {
      throw createClientImageError(displayName, 'must be a single-frame image.')
    }

    const { data, info } = await image
      .rotate()
      .resize({
        width: maxDimension,
        height: maxDimension,
        fit: 'inside',
        withoutEnlargement: true
      })
      .flatten({ background: '#ffffff' })
      .jpeg({
        quality: jpegQuality,
        progressive: true,
        chromaSubsampling: '4:2:0'
      })
      .toBuffer({ resolveWithObject: true })

    if (!info.width || !info.height || !isAllowedImageSize(data.byteLength)) {
      throw createClientImageError(
        displayName,
        'could not be normalized within the upload limits.'
      )
    }

    return {
      fileBuffer: new Uint8Array(data),
      fileName: getSanitizedFileName(fileName),
      mimeType: 'image/jpeg',
      sourceFormat: expectedFormat,
      sourceWidth: metadata.width,
      sourceHeight: metadata.height,
      sourceSize: fileBuffer.byteLength,
      sourceHadMetadata: hasEmbeddedMetadata(metadata),
      outputWidth: info.width,
      outputHeight: info.height,
      outputSize: data.byteLength
    }
  } catch (error) {
    if (error instanceof ImageSanitizationError) {
      throw error
    }

    throw createClientImageError(
      displayName,
      'could not be decoded as a supported image.'
    )
  }
}
