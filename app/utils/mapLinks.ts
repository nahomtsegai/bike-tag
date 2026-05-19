const googleMapsHosts = new Set([
  'google.com',
  'www.google.com',
  'maps.google.com',
  'maps.app.goo.gl'
])

const isGoogleMapsPath = (url: URL) => {
  if (url.hostname === 'maps.app.goo.gl') {
    return true
  }

  return url.pathname.startsWith('/maps')
}

export const isValidMapUrl = (mapUrl: string) => {
  const trimmedMapUrl = mapUrl.trim()

  if (!trimmedMapUrl) {
    return false
  }

  try {
    const url = new URL(trimmedMapUrl)

    return (
      url.protocol === 'https:' &&
      googleMapsHosts.has(url.hostname) &&
      isGoogleMapsPath(url)
    )
  } catch {
    return false
  }
}

export const createMapSearchUrl = (locationName: string) => {
  const trimmedLocationName = locationName.trim()

  if (!trimmedLocationName) {
    return ''
  }

  const searchQuery = encodeURIComponent(trimmedLocationName)

  return `https://www.google.com/maps/search/?api=1&query=${searchQuery}`
}

export const createMapUrl = (
  locationName: string,
  locationMapUrl?: string
) => {
  const trimmedLocationMapUrl = locationMapUrl?.trim() ?? ''

  if (isValidMapUrl(trimmedLocationMapUrl)) {
    return trimmedLocationMapUrl
  }

  return createMapSearchUrl(locationName)
}