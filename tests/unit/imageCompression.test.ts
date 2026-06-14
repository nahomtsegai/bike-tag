import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'
import { loadImageFromFile } from '../../app/utils/imageCompression'

type ImageLoadResult = 'load' | 'error'

let imageLoadResult: ImageLoadResult
let naturalWidth: number
let naturalHeight: number

const createObjectURLMock = vi.fn(() => {
  return 'blob:bike-tag-photo'
})

const revokeObjectURLMock = vi.fn()

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

describe('imageCompression', () => {
  beforeEach(() => {
    imageLoadResult = 'load'
    naturalWidth = 3024
    naturalHeight = 4032

    createObjectURLMock.mockClear()
    revokeObjectURLMock.mockClear()

    vi.stubGlobal('Image', MockImage)
    vi.stubGlobal('URL', {
      createObjectURL: createObjectURLMock,
      revokeObjectURL: revokeObjectURLMock
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
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

      expect(revokeObjectURLMock).toHaveBeenCalledWith(
        'blob:bike-tag-photo'
      )
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

      expect(revokeObjectURLMock).toHaveBeenCalledWith(
        'blob:bike-tag-photo'
      )
    })
  })
})
