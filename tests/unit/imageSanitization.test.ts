import sharp from 'sharp'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  maxSanitizedImageDimension,
  sanitizeUploadedImage,
  sanitizedImageMimeType
} from '../../server/utils/imageSanitization'

type CreateErrorInput = {
  statusCode: number
  statusMessage: string
}

const createTestError = ({ statusCode, statusMessage }: CreateErrorInput) => {
  const error = new Error(statusMessage) as Error & CreateErrorInput
  error.statusCode = statusCode
  error.statusMessage = statusMessage
  return error
}

describe('sanitizeUploadedImage', () => {
  beforeEach(() => {
    vi.stubGlobal('createError', createTestError)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('rejects a corrupted image that cannot be decoded', async () => {
    await expect(
      sanitizeUploadedImage({
        fileBuffer: new Uint8Array([0xff, 0xd8, 0xff, 0x00, 0x01])
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage:
        'Photo could not be decoded as a valid JPG, PNG, or WebP image.'
    })
  })

  it('resizes oversized images and normalizes them to WebP', async () => {
    const source = await sharp({
      create: {
        width: 3600,
        height: 1800,
        channels: 3,
        background: '#167f72'
      }
    })
      .png()
      .toBuffer()

    const result = await sanitizeUploadedImage({
      fileBuffer: new Uint8Array(source)
    })
    const metadata = await sharp(result.fileBuffer).metadata()

    expect(result.mimeType).toBe(sanitizedImageMimeType)
    expect(metadata.format).toBe('webp')
    expect(metadata.width).toBe(maxSanitizedImageDimension)
    expect(metadata.height).toBe(1200)
    expect(result.sanitizedSizeInBytes).toBeLessThan(result.originalSizeInBytes)
  })

  it('does not enlarge images already within the maximum dimensions', async () => {
    const source = await sharp({
      create: {
        width: 640,
        height: 480,
        channels: 4,
        background: { r: 40, g: 80, b: 120, alpha: 0.5 }
      }
    })
      .png()
      .toBuffer()

    const result = await sanitizeUploadedImage({
      fileBuffer: new Uint8Array(source)
    })

    expect(result.width).toBe(640)
    expect(result.height).toBe(480)
  })

  it('strips EXIF metadata while preserving the visible image', async () => {
    const source = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: '#d97706'
      }
    })
      .jpeg()
      .withMetadata({
        orientation: 6,
        exif: {
          IFD0: {
            Artist: 'Bike Tag test camera'
          }
        }
      })
      .toBuffer()

    const sourceMetadata = await sharp(source).metadata()
    expect(sourceMetadata.exif).toBeDefined()

    const result = await sanitizeUploadedImage({
      fileBuffer: new Uint8Array(source)
    })
    const sanitizedMetadata = await sharp(result.fileBuffer).metadata()

    expect(sanitizedMetadata.exif).toBeUndefined()
    expect(sanitizedMetadata.orientation).toBeUndefined()
    expect(sanitizedMetadata.width).toBe(600)
    expect(sanitizedMetadata.height).toBe(800)
  })
})
