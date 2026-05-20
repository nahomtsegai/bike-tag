const allowedImageMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp'
])

const maxImageFileSizeInBytes = 8 * 1024 * 1024

export const isAllowedImageMimeType = (mimeType: string) => {
  return allowedImageMimeTypes.has(mimeType)
}

export const isAllowedImageSize = (sizeInBytes: number) => {
  return sizeInBytes > 0 && sizeInBytes <= maxImageFileSizeInBytes
}