import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { compressImageFile } from './imageCompression'

const originalImage = globalThis.Image
const originalCreateObjectUrl = URL.createObjectURL
const originalRevokeObjectUrl = URL.revokeObjectURL
const originalCreateElement = document.createElement.bind(document)

class MockImage {
  src = ''
  decoding = ''
  naturalWidth = 3200
  naturalHeight = 2400

  decode = vi.fn().mockResolvedValue(undefined)
}

const createFile = ({
  name,
  type,
  size
}: {
  name: string
  type: string
  size: number
}) => {
  return new File(
    [new Uint8Array(size)],
    name,
    {
      type,
      lastModified: 123
    }
  )
}

describe('compressImageFile', () => {
  beforeEach(() => {
    vi.stubGlobal('Image', MockImage)

    URL.createObjectURL = vi.fn(() => 'blob:mock-image-url')
    URL.revokeObjectURL = vi.fn()

    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName !== 'canvas') {
        return originalCreateElement(tagName)
      }

      return {
        width: 0,
        height: 0,
        getContext: vi.fn(() => ({
          drawImage: vi.fn()
        })),
        toBlob: vi.fn((callback) => {
          callback(
            new Blob(
              [new Uint8Array(500_000)],
              { type: 'image/jpeg' }
            )
          )
        })
      } as unknown as HTMLCanvasElement
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()

    globalThis.Image = originalImage
    URL.createObjectURL = originalCreateObjectUrl
    URL.revokeObjectURL = originalRevokeObjectUrl
  })

  it('returns small jpeg files unchanged', async () => {
    const file = createFile({
      name: 'small-photo.jpg',
      type: 'image/jpeg',
      size: 500_000
    })

    const result = await compressImageFile(file)

    expect(result).toBe(file)
  })

  it('compresses large image files to jpeg', async () => {
    const file = createFile({
      name: 'large-photo.jpeg',
      type: 'image/jpeg',
      size: 7_500_000
    })

    const result = await compressImageFile(file)

    expect(result).not.toBe(file)
    expect(result.name).toBe('large-photo-compressed.jpg')
    expect(result.type).toBe('image/jpeg')
    expect(result.size).toBe(500_000)
  })

  it('returns the original file when compression would make it larger', async () => {
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName !== 'canvas') {
        return originalCreateElement(tagName)
      }

      return {
        width: 0,
        height: 0,
        getContext: vi.fn(() => ({
          drawImage: vi.fn()
        })),
        toBlob: vi.fn((callback) => {
          callback(
            new Blob(
              [new Uint8Array(8_000_000)],
              { type: 'image/jpeg' }
            )
          )
        })
      } as unknown as HTMLCanvasElement
    })

    const file = createFile({
      name: 'large-photo.jpeg',
      type: 'image/jpeg',
      size: 7_500_000
    })

    const result = await compressImageFile(file)

    expect(result).toBe(file)
  })

  it('returns non-image files unchanged', async () => {
    const file = createFile({
      name: 'not-image.txt',
      type: 'text/plain',
      size: 5_000_000
    })

    const result = await compressImageFile(file)

    expect(result).toBe(file)
  })

  it('attempts to compress heic files even when they are under the size threshold', async () => {
    const file = createFile({
      name: 'phone-photo.heic',
      type: 'image/heic',
      size: 500_000
    })

    const result = await compressImageFile(file)

    expect(result).not.toBe(file)
    expect(result.name).toBe('phone-photo-compressed.jpg')
    expect(result.type).toBe('image/jpeg')
  })
})