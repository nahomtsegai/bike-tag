export const maxImageFileSizeInBytes = 8 * 1024 * 1024
export const maxImageFileSizeLabel = '8 MB'

export const allowedImageMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp'
])

export const isAllowedImageMimeType = (mimeType: string) => {
  return allowedImageMimeTypes.has(mimeType)
}

export const isAllowedImageSize = (sizeInBytes: number) => {
  return sizeInBytes > 0 && sizeInBytes <= maxImageFileSizeInBytes
}