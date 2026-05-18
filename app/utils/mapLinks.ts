export const createMapSearchUrl = (locationName: string) => {
  const trimmedLocationName = locationName.trim()

  if (!trimmedLocationName) {
    return ''
  }

  const searchQuery = encodeURIComponent(trimmedLocationName)

  return `https://www.google.com/maps/search/?api=1&query=${searchQuery}`
}