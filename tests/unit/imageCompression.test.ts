import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'
import {
  loadImageBitmapFromFile,
  loadImageFromFile,
  loadRenderableImageFromFile,
  shouldPrepareImageFile
} from '../../app/utils/imageCompression'

type ImageLoadResult = 'load' | 'error'

let imageLoadResult: ImageLoadResult
let naturalWidth: number
let naturalHeight: number

const createObjectURLMock = vi.fn(() => {
  return 'blob:bike-tag-photo'
})

const revokeObjectURLMock = vi.fn()
const createImageBitmapMock = vi.fn()

class MockImage {
  decoding = 'auto'
  naturalWidth = naturalWidth
  naturalHeight = naturalHeight
  onload: (() => void) | null = null
  onerror: (() => void) | null = null

  private imageSource = ''

  set src(value: string) {
    this.imageSource = value

    queueMicrotask(() => {
      if (imageLoadResult === 'load') {
        this.onload?.()
        return
      }

      this.onerror?.()
    })
  }

  get src() {
    return this.imageSource
  }
}

const createImageFile = () => {
  return new File(
    [new Uint8Array([1, 2, 3])],
    'bike-tag-photo.jpg',
    {
      type: 'image/jpeg',
      lastModified: Date.now()
    }
  )
}

const createHeicFile = () => {
  return new File(
    [new Uint8Array([1, 2, 3])],
    'iphone-photo.heic',
    {
      type: 'image/heic',
      lastModified: Date.now()
    }
  )
}

const createImageBitmapResult = ({
  width = 3024,
  height = 4032
}: {
  width?: number
  height?: number
} = {}) => {
  return {
    width,
    height,
    close: vi.fn()
  } as unknown as ImageBitmap
}

describe('imageCompression', () => {
  beforeEach(() => {
    imageLoadResult = 'load'
    naturalWidth = 3024
    naturalHeight = 4032

    createObjectURLMock.mockClear()
    revokeObjectURLMock.mockClear()
    createImageBitmapMock.mockReset()

    vi.stubGlobal('Image', MockImage)
    vi.stubGlobal('createImageBitmap', createImageBitmapMock)
    vi.stubGlobal('URL', {
      createObjectURL: createObjectURLMock,
      revokeObjectURL: revokeObjectURLMock
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('shouldPrepareImageFile', () => {
    it('always prepares HEIC and HEIF sources', () => {
      expect(
        shouldPrepareImageFile({
          name: 'phone-photo.heic',
          type: 'image/heic',
          size: 400_000
        })
      ).toBe(true)
      expect(
        shouldPrepareImageFile({
          name: 'phone-photo.HEIF',
          type: '',
          size: 400_000
        })
      ).toBe(true)
      expect(
        shouldPrepareImageFile({
          name: 'phone-photo.heif',
          type: 'application/octet-stream',
          size: 400_000
        })
      ).toBe(true)
    })

    it('prepares only large normal image files', () => {
      expect(
        shouldPrepareImageFile({
          name: 'small.jpg',
          type: 'image/jpeg',
          size: 500_000
        })
      ).toBe(false)
      expect(
        shouldPrepareImageFile({
          name: 'large.jpg',
          type: 'image/jpeg',
          size: 2_000_000
        })
      ).toBe(true)
      expect(
        shouldPrepareImageFile({
          name: 'document.pdf',
          type: 'application/pdf',
          size: 5_000_000
        })
      ).toBe(false)
    })
  })

  describe('loadImageFromFile', () => {
    it('loads an image through the load event', async () => {
      const file = createImageFile()
      const image = await loadImageFromFile(file)

      expect(createObjectURLMock).toHaveBeenCalledWith(file)
      expect(image.decoding).toBe('async')
      expect(image.src).toBe('blob:bike-tag-photo')
      expect(image.naturalWidth).toBe(3024)
      expect(image.naturalHeight).toBe(4032)
      expect(revokeObjectURLMock).toHaveBeenCalledWith(
        'blob:bike-tag-photo'
      )
    })

    it('throws an EncodingError when the image cannot be loaded', async () => {
      imageLoadResult = 'error'

      await expect(
        loadImageFromFile(createImageFile())
      ).rejects.toMatchObject({
        name: 'EncodingError',
        message: 'The selected image could not be decoded.'
      })
    })

    it('throws an EncodingError when the loaded image has invalid dimensions', async () => {
      naturalWidth = 0
      naturalHeight = 0

      await expect(
        loadImageFromFile(createImageFile())
      ).rejects.toMatchObject({
        name: 'EncodingError',
        message: 'The selected image has invalid dimensions.'
      })
    })
  })

  describe('loadImageBitmapFromFile', () => {
    it('loads a bitmap with source orientation applied', async () => {
      const file = createHeicFile()
      const imageBitmap = createImageBitmapResult()
      createImageBitmapMock.mockResolvedValue(imageBitmap)

      await expect(loadImageBitmapFromFile(file)).resolves.toBe(imageBitmap)
      expect(createImageBitmapMock).toHaveBeenCalledWith(file, {
        imageOrientation: 'from-image'
      })
    })

    it('closes and rejects a bitmap with invalid dimensions', async () => {
      const imageBitmap = createImageBitmapResult({ width: 0 })
      createImageBitmapMock.mockResolvedValue(imageBitmap)

      await expect(
        loadImageBitmapFromFile(createHeicFile())
      ).rejects.toMatchObject({
        name: 'EncodingError',
        message: 'The selected image has invalid dimensions.'
      })
      expect(imageBitmap.close).toHaveBeenCalledTimes(1)
    })
  })

  describe('loadRenderableImageFromFile', () => {
    it('prefers bitmap decoding for HEIC photos', async () => {
      const file = createHeicFile()
      const imageBitmap = createImageBitmapResult()
      createImageBitmapMock.mockResolvedValue(imageBitmap)

      await expect(loadRenderableImageFromFile(file)).resolves.toBe(
        imageBitmap
      )
      expect(createObjectURLMock).not.toHaveBeenCalled()
    })

    it('falls back to image element decoding when bitmap decoding fails', async () => {
      const file = createHeicFile()
      createImageBitmapMock.mockRejectedValue(
        new DOMException('Bitmap decode failed.', 'EncodingError')
      )

      const image = await loadRenderableImageFromFile(file)

      expect(image).toBeInstanceOf(MockImage)
      expect(createObjectURLMock).toHaveBeenCalledWith(file)
    })

    it('uses image element decoding for standard photos', async () => {
      const file = createImageFile()

      const image = await loadRenderableImageFromFile(file)

      expect(image).toBeInstanceOf(MockImage)
      expect(createImageBitmapMock).not.toHaveBeenCalled()
      expect(createObjectURLMock).toHaveBeenCalledWith(file)
    })
  })
})
