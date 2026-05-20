import { isValidGoogleMapsUrl } from '../../shared/utils/mapValidation'

export const createMapUrl = (mapUrl?: string) => {
  if (!mapUrl) {
    return ''
  }

  return mapUrl
}

export const isValidMapUrl = (mapUrl: string) => {
  return isValidGoogleMapsUrl(mapUrl)
}