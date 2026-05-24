export const maxImageFileSizeInBytes = 8 * 1024 * 1024
export const maxImageFileSizeLabel = '8 MB'

export const allowedImageMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp'
])

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
  const allowedExtensions =
    allowedImageExtensionsByMimeType[
      mimeType as keyof typeof allowedImageExtensionsByMimeType
    ]

  return allowedExtensions.has(fileExtension)
}