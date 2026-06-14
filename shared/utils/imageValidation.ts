export const maxImageFileSizeInBytes = 8 * 1024 * 1024
export const maxImageFileSizeLabel = '8 MB'
export const maxSourceImageFileSizeInBytes = 25 * 1024 * 1024
export const maxSourceImageFileSizeLabel = '25 MB'
export const maxCombinedSubmitPhotoSizeInBytes = 4_000_000
export const maxCombinedSubmitPhotoSizeLabel = '4 MB'
export const allowedImageFileTypesLabel = 'JPG, PNG, or WebP'

export const allowedImageMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp'
])



const matchesBytes = (
  fileBuffer: Uint8Array,
  offset: number,
  expectedBytes: readonly number[]
) => {
  if (fileBuffer.length < offset + expectedBytes.length) {
    return false
  }

  return expectedBytes.every((expectedByte, index) => {
    return fileBuffer[offset + index] === expectedByte
  })
}

const imageContentValidatorsByMimeType = {
  'image/jpeg': (fileBuffer: Uint8Array) => {
    return matchesBytes(fileBuffer, 0, [0xff, 0xd8, 0xff])
  },
  'image/png': (fileBuffer: Uint8Array) => {
    return matchesBytes(fileBuffer, 0, [
      0x89,
      0x50,
      0x4e,
      0x47,
      0x0d,
      0x0a,
      0x1a,
      0x0a
    ])
  },
  'image/webp': (fileBuffer: Uint8Array) => {
    return (
      matchesBytes(fileBuffer, 0, [0x52, 0x49, 0x46, 0x46]) &&
      matchesBytes(fileBuffer, 8, [0x57, 0x45, 0x42, 0x50])
    )
  }
} as const

const allowedImageExtensionsByMimeType = {
  'image/jpeg': new Set(['jpg', 'jpeg']),
  'image/png': new Set(['png']),
  'image/webp': new Set(['webp'])
} as const

export const isAllowedImageMimeType = (mimeType: string) => {
  return allowedImageMimeTypes.has(mimeType)
}

export const isAllowedImageSize = (sizeInBytes: number) => {
  return sizeInBytes > 0 && sizeInBytes <= maxImageFileSizeInBytes
}

export const isAllowedSourceImageSize = (sizeInBytes: number) => {
  return (
    sizeInBytes > 0 &&
    sizeInBytes <= maxSourceImageFileSizeInBytes
  )
}

export const isAllowedCombinedSubmitPhotoSize = (
  matchPhotoSizeInBytes: number,
  nextPhotoSizeInBytes: number,
  maxCombinedSizeInBytes = maxCombinedSubmitPhotoSizeInBytes
) => {
  return (
    matchPhotoSizeInBytes > 0 &&
    nextPhotoSizeInBytes > 0 &&
    matchPhotoSizeInBytes + nextPhotoSizeInBytes <=
      maxCombinedSizeInBytes
  )
}

export const getFileExtension = (fileName: string) => {
  const trimmedFileName = fileName.trim()

  if (!trimmedFileName.includes('.')) {
    return ''
  }

  const fileExtension = trimmedFileName.split('.').pop()?.trim().toLowerCase()

  return fileExtension || ''
}

export const isAllowedImageExtension = (fileName: string) => {
  const fileExtension = getFileExtension(fileName)

  return Object.values(allowedImageExtensionsByMimeType).some((extensions) => {
    return extensions.has(fileExtension)
  })
}

export const isAllowedImageMimeTypeAndExtension = (
  mimeType: string,
  fileName: string
) => {
  if (!isAllowedImageMimeType(mimeType)) {
    return false
  }

  const fileExtension = getFileExtension(fileName)

  const allowedExtensions = allowedImageExtensionsByMimeType[
    mimeType as keyof typeof allowedImageExtensionsByMimeType
  ]

  return allowedExtensions.has(fileExtension)
}

export const doesImageContentMatchMimeType = (
  mimeType: string,
  fileBuffer: Uint8Array
) => {
  const validator = imageContentValidatorsByMimeType[
    mimeType as keyof typeof imageContentValidatorsByMimeType
  ]

  return validator ? validator(fileBuffer) : false
}
