export type TagSeoSource = {
  title: string
  clue?: string
  imageUrl?: string
  foundBy?: string
  createdAt?: string
  createdAtIso?: string
  status: 'active' | 'found'
}

export type TagSeoMetadata = {
  title: string
  description: string
  canonicalUrl: string
  imageUrl: string
  imageAlt: string
  robots: 'index, follow' | 'noindex, nofollow'
}

const siteName = 'Louisville Bike Tag'
const fallbackImagePath = '/og-image.png'
const maxDescriptionLength = 160

const normalizeSiteUrl = (siteUrl: string) => siteUrl.replace(/\/+$/, '')

const createAbsoluteUrl = (siteUrl: string, value: string) => {
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }

  const normalizedPath = value.startsWith('/') ? value : `/${value}`
  return `${normalizeSiteUrl(siteUrl)}${normalizedPath}`
}

const truncateDescription = (description: string) => {
  if (description.length <= maxDescriptionLength) {
    return description
  }

  return `${description.slice(0, maxDescriptionLength - 1).trimEnd()}…`
}

export const createTagCanonicalUrl = (siteUrl: string, tagId: string) => {
  return `${normalizeSiteUrl(siteUrl)}/tag/${encodeURIComponent(tagId)}`
}

export const createTagDescription = (tag: TagSeoSource) => {
  if (tag.status === 'active') {
    const clueText = tag.clue?.trim()
    const description = clueText
      ? `${tag.title} is the current Louisville Bike Tag. Clue: ${clueText} Ride out and find the mystery location.`
      : `${tag.title} is the current Louisville Bike Tag. Ride out and find the mystery location.`

    return truncateDescription(description)
  }

  const rider = tag.foundBy?.trim() || 'a Louisville rider'
  const foundDate = tag.createdAt?.trim() ? ` on ${tag.createdAt.trim()}` : ''
  const clueText = tag.clue?.trim()
  const description = clueText
    ? `${tag.title} was found by ${rider}${foundDate}. Clue: ${clueText}`
    : `${tag.title} was found by ${rider}${foundDate}. Explore this completed Louisville Bike Tag.`

  return truncateDescription(description)
}

export const createTagSeoMetadata = (
  tag: TagSeoSource | null,
  siteUrl: string,
  tagId: string
): TagSeoMetadata => {
  const canonicalUrl = createTagCanonicalUrl(siteUrl, tagId)

  if (!tag) {
    return {
      title: `Tag Not Found | ${siteName}`,
      description:
        'This Louisville Bike Tag could not be found. Browse the current tag or completed tag history instead.',
      canonicalUrl,
      imageUrl: createAbsoluteUrl(siteUrl, fallbackImagePath),
      imageAlt: siteName,
      robots: 'noindex, nofollow'
    }
  }

  return {
    title: `${tag.title} | ${siteName}`,
    description: createTagDescription(tag),
    canonicalUrl,
    imageUrl: createAbsoluteUrl(siteUrl, tag.imageUrl || fallbackImagePath),
    imageAlt: `${tag.title} Bike Tag photo`,
    robots: 'index, follow'
  }
}
