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

const getFileExtension = (fileName: string) => {
  const extension = fileName.split('.').pop()?.trim().toLowerCase()

  return extension || 'jpg'
}

const getCompressedFileName = (fileName: string) => {
  const fileNameWithoutExtension = fileName.replace(/\.[^/.]+$/, '')

  return `${fileNameWithoutExtension || 'bike-tag-photo'}-compressed.jpg`
}

export const loadImageFromFile = async (file: File) => {
  const imageUrl = URL.createObjectURL(file)

  try {
    const image = new Image()

    image.decoding = 'async'

    await new Promise<void>((resolve, reject) => {
      image.onload = () => {
        resolve()
      }

      image.onerror = () => {
        reject(
          new DOMException(
            'The selected image could not be decoded.',
            'EncodingError'
          )
        )
      }

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
    return {
      width,
      height
    }
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
  image: HTMLImageElement
  maxDimension: number
  quality: number
}) => {
  const resizedDimensions = getResizedDimensions({
    width: image.naturalWidth,
    height: image.naturalHeight,
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

  const compressedBlob = await canvasToBlob(
    canvas,
    'image/jpeg',
    quality
  )

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

  if (!file.type.startsWith('image/')) {
    return file
  }

  const maxDimension = options.maxDimension ?? defaultMaxImageDimension
  const quality = options.quality ?? defaultJpegQuality
  const compressionThresholdBytes =
    options.compressionThresholdBytes ?? defaultCompressionThresholdBytes

  const fileExtension = getFileExtension(file.name)

  if (
    file.size <= compressionThresholdBytes &&
    fileExtension !== 'heic' &&
    fileExtension !== 'heif'
  ) {
    return file
  }

  const image = await loadImageFromFile(file)
  const compressedFile = await renderCompressedImage({
    file,
    image,
    maxDimension,
    quality
  })

  if (
    compressedFile.size >= file.size &&
    fileExtension !== 'heic' &&
    fileExtension !== 'heif'
  ) {
    return file
  }

  return compressedFile
}

export const compressImageFileToMaxSize = async (
  file: File,
  maxSizeInBytes: number
) => {
  if (!import.meta.client) {
    return file
  }

  if (!file.type.startsWith('image/') || file.size <= maxSizeInBytes) {
    return file
  }

  const image = await loadImageFromFile(file)
  let smallestFile = file

  for (const profile of targetCompressionProfiles) {
    const compressedFile = await renderCompressedImage({
      file,
      image,
      ...profile
    })

    if (compressedFile.size < smallestFile.size) {
      smallestFile = compressedFile
    }

    if (compressedFile.size <= maxSizeInBytes) {
      return compressedFile
    }
  }

  return smallestFile
}
