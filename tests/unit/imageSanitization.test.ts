import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import {
  ImageSanitizationError,
  sanitizeUploadedImage
} from '../../server/utils/imageSanitization'

const createDeterministicNoise = (length: number) => {
  const pixels = new Uint8Array(length)
  let value = 17

  for (let index = 0; index < pixels.length; index += 1) {
    value = (value * 73 + 41) % 256
    pixels[index] = value
  }

  return pixels
}

describe('sanitizeUploadedImage', () => {
  it('decodes, auto-orients, resizes, and strips metadata into a JPEG', async () => {
    const sourceBuffer = await sharp({
      create: {
        width: 2400,
        height: 1200,
        channels: 3,
        background: '#336699'
      }
    })
      .withMetadata({ orientation: 6 })
      .jpeg({ quality: 95 })
      .toBuffer()

    const sanitized = await sanitizeUploadedImage({
      fileBuffer: sourceBuffer,
      fileName: 'Phone Photo.jpeg',
      mimeType: 'image/jpeg',
      displayName: 'Matching photo'
    })
    const outputMetadata = await sharp(sanitized.fileBuffer).metadata()

    expect(sanitized.fileName).toBe('Phone-Photo-sanitized.jpg')
    expect(sanitized.mimeType).toBe('image/jpeg')
    expect(sanitized.sourceFormat).toBe('jpeg')
    expect(sanitized.sourceWidth).toBe(2400)
    expect(sanitized.sourceHeight).toBe(1200)
    expect(sanitized.sourceHadMetadata).toBe(true)
    expect(sanitized.outputWidth).toBe(800)
    expect(sanitized.outputHeight).toBe(1600)
    expect(outputMetadata.format).toBe('jpeg')
    expect(outputMetadata.orientation).toBeUndefined()
    expect(outputMetadata.exif).toBeUndefined()
    expect(outputMetadata.icc).toBeUndefined()
    expect(outputMetadata.xmp).toBeUndefined()
  })

  it('flattens transparent images and normalizes them to JPEG', async () => {
    const sourceBuffer = await sharp({
      create: {
        width: 32,
        height: 16,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 0.25 }
      }
    })
      .png()
      .toBuffer()

    const sanitized = await sanitizeUploadedImage({
      fileBuffer: sourceBuffer,
      fileName: 'transparent.png',
      mimeType: 'image/png',
      displayName: 'Next tag photo'
    })
    const outputMetadata = await sharp(sanitized.fileBuffer).metadata()

    expect(sanitized.sourceFormat).toBe('png')
    expect(outputMetadata.format).toBe('jpeg')
    expect(outputMetadata.hasAlpha).toBe(false)
    expect(outputMetadata.channels).toBe(3)
  })

  it('compresses a high-entropy source image', async () => {
    const width = 1200
    const height = 1200
    const sourceBuffer = await sharp(
      createDeterministicNoise(width * height * 3),
      {
        raw: {
          width,
          height,
          channels: 3
        }
      }
    )
      .png({ compressionLevel: 0 })
      .toBuffer()

    const sanitized = await sanitizeUploadedImage({
      fileBuffer: sourceBuffer,
      fileName: 'large.png',
      mimeType: 'image/png',
      displayName: 'Matching photo'
    })

    expect(sanitized.outputSize).toBeLessThan(sanitized.sourceSize)
    expect(sanitized.outputSize).toBe(sanitized.fileBuffer.byteLength)
  })

  it('rejects content that does not match the declared MIME type', async () => {
    const pngBuffer = await sharp({
      create: {
        width: 20,
        height: 20,
        channels: 3,
        background: '#ffffff'
      }
    })
      .png()
      .toBuffer()

    await expect(
      sanitizeUploadedImage({
        fileBuffer: pngBuffer,
        fileName: 'fake.jpg',
        mimeType: 'image/jpeg',
        displayName: 'Matching photo'
      })
    ).rejects.toMatchObject({
      name: 'ImageSanitizationError',
      statusCode: 400,
      statusMessage:
        'Matching photo content must match the declared image type.'
    })
  })

  it('rejects corrupt files even when they begin with image magic bytes', async () => {
    await expect(
      sanitizeUploadedImage({
        fileBuffer: new Uint8Array([0xff, 0xd8, 0xff, 0x00, 0x01]),
        fileName: 'corrupt.jpg',
        mimeType: 'image/jpeg',
        displayName: 'Matching photo'
      })
    ).rejects.toBeInstanceOf(ImageSanitizationError)
  })

  it('rejects images that exceed the decoded pixel limit', async () => {
    const sourceBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: '#ffffff'
      }
    })
      .jpeg()
      .toBuffer()

    await expect(
      sanitizeUploadedImage({
        fileBuffer: sourceBuffer,
        fileName: 'too-many-pixels.jpg',
        mimeType: 'image/jpeg',
        displayName: 'Matching photo',
        maxInputPixels: 5_000
      })
    ).rejects.toMatchObject({
      name: 'ImageSanitizationError',
      statusCode: 400
    })
  })
})
