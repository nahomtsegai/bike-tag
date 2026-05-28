import { isValidGoogleMapsUrl } from '~~/shared/utils/mapValidation'

export const createMapUrl = (mapUrl?: string) => {
  if (!mapUrl) {
    return ''
  }

  const trimmedMapUrl = mapUrl.trim()

  if (!isValidGoogleMapsUrl(trimmedMapUrl)) {
    return ''
  }

  return trimmedMapUrl
}

export const isValidMapUrl = (mapUrl: string) => {
  return isValidGoogleMapsUrl(mapUrl)
}