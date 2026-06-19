import { isHeicImageFile } from '~~/shared/utils/imageValidation'

const defaultMaxImageDimension = 1600
const defaultJpegQuality = 0.75
const defaultCompressionThresholdBytes = 1_500_000

const targetCompressionProfiles = [
  { maxDimension: 1600, quality: 0.75 },
  { maxDimension: 1600, quality: 0.65 },
  { maxDimension: 1400, quality: 0.6 },
  { maxDimension: 1200, quality: 0.55 },
  { maxDimension: 1000, quality: 0.5 },
  { maxDimension: 800, quality: 0.45 }
] as const

type CompressImageFileOptions = {
  maxDimension?: number
  quality?: number
  compressionThresholdBytes?: number
}

type RenderableImage = HTMLImageElement | ImageBitmap

const getCompressedFileName = (fileName: string) => {
  const fileNameWithoutExtension = fileName.replace(/\.[^/.]+$/, '')
  return `${fileNameWithoutExtension || 'bike-tag-photo'}-compressed.jpg`
}

export const shouldPrepareImageFile = (
  file: Pick<File, 'name' | 'type' | 'size'>,
  compressionThresholdBytes = defaultCompressionThresholdBytes
) => {
  if (isHeicImageFile(file.type, file.name)) {
    return true
  }

  return (
    file.type.startsWith('image/') &&
    file.size > compressionThresholdBytes
  )
}

export const loadImageFromFile = async (file: File) => {
  const imageUrl = URL.createObjectURL(file)

  try {
    const image = new Image()
    image.decoding = 'async'

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(
        new DOMException(
          'The selected image could not be decoded.',
          'EncodingError'
        )
      )
      image.src = imageUrl
    })

    if (!image.naturalWidth || !image.naturalHeight) {
      throw new DOMException(
        'The selected image has invalid dimensions.',
        'EncodingError'
      )
    }

    return image
  } finally {
    URL.revokeObjectURL(imageUrl)
  }
}

export const loadImageBitmapFromFile = async (file: File) => {
  if (typeof createImageBitmap !== 'function') {
    throw new DOMException(
      'This browser does not support bitmap image decoding.',
      'NotSupportedError'
    )
  }

  const imageBitmap = await createImageBitmap(file, {
    imageOrientation: 'from-image'
  })

  if (!imageBitmap.width || !imageBitmap.height) {
    imageBitmap.close()
    throw new DOMException(
      'The selected image has invalid dimensions.',
      'EncodingError'
    )
  }

  return imageBitmap
}

export const loadRenderableImageFromFile = async (file: File) => {
  if (
    isHeicImageFile(file.type, file.name) &&
    typeof createImageBitmap === 'function'
  ) {
    try {
      return await loadImageBitmapFromFile(file)
    } catch {
      // Safari and other browsers vary in which native HEIC decoder path works.
      // Fall back to the image element path before reporting a conversion error.
    }
  }

  return await loadImageFromFile(file)
}

const getRenderableImageDimensions = (image: RenderableImage) => {
  if ('naturalWidth' in image) {
    return {
      width: image.naturalWidth,
      height: image.naturalHeight
    }
  }

  return {
    width: image.width,
    height: image.height
  }
}

const releaseRenderableImage = (image: RenderableImage) => {
  if ('close' in image && typeof image.close === 'function') {
    image.close()
  }
}

const getResizedDimensions = ({
  width,
  height,
  maxDimension
}: {
  width: number
  height: number
  maxDimension: number
}) => {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height }
  }

  const scale = Math.min(maxDimension / width, maxDimension / height)
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale)
  }
}

const canvasToBlob = async (
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
) => {
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Could not compress image.'))
          return
        }
        resolve(blob)
      },
      type,
      quality
    )
  })
}

const renderCompressedImage = async ({
  file,
  image,
  maxDimension,
  quality
}: {
  file: File
  image: RenderableImage
  maxDimension: number
  quality: number
}) => {
  const sourceDimensions = getRenderableImageDimensions(image)
  const resizedDimensions = getResizedDimensions({
    ...sourceDimensions,
    maxDimension
  })
  const canvas = document.createElement('canvas')
  canvas.width = resizedDimensions.width
  canvas.height = resizedDimensions.height

  const canvasContext = canvas.getContext('2d')
  if (!canvasContext) {
    return file
  }

  canvasContext.drawImage(
    image,
    0,
    0,
    resizedDimensions.width,
    resizedDimensions.height
  )

  const compressedBlob = await canvasToBlob(canvas, 'image/jpeg', quality)

  return new File(
    [compressedBlob],
    getCompressedFileName(file.name),
    {
      type: 'image/jpeg',
      lastModified: Date.now()
    }
  )
}

export const compressImageFile = async (
  file: File,
  options: CompressImageFileOptions = {}
) => {
  if (!import.meta.client) {
    return file
  }

  const compressionThresholdBytes =
    options.compressionThresholdBytes ?? defaultCompressionThresholdBytes

  if (!shouldPrepareImageFile(file, compressionThresholdBytes)) {
    return file
  }

  const isHeicSource = isHeicImageFile(file.type, file.name)
  const image = await loadRenderableImageFromFile(file)

  try {
    const compressedFile = await renderCompressedImage({
      file,
      image,
      maxDimension: options.maxDimension ?? defaultMaxImageDimension,
      quality: options.quality ?? defaultJpegQuality
    })

    if (compressedFile.size >= file.size && !isHeicSource) {
      return file
    }

    return compressedFile
  } finally {
    releaseRenderableImage(image)
  }
}

export const compressImageFileToMaxSize = async (
  file: File,
  maxSizeInBytes: number
) => {
  if (!import.meta.client) {
    return file
  }

  const isHeicSource = isHeicImageFile(file.type, file.name)

  if (
    !shouldPrepareImageFile(file, maxSizeInBytes) &&
    !isHeicSource
  ) {
    return file
  }

  const image = await loadRenderableImageFromFile(file)
  let smallestFile: File | null = isHeicSource ? null : file

  try {
    for (const profile of targetCompressionProfiles) {
      const compressedFile = await renderCompressedImage({
        file,
        image,
        ...profile
      })

      if (!smallestFile || compressedFile.size < smallestFile.size) {
        smallestFile = compressedFile
      }

      if (compressedFile.size <= maxSizeInBytes) {
        return compressedFile
      }
    }

    return smallestFile ?? file
  } finally {
    releaseRenderableImage(image)
  }
}
