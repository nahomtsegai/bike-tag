import type { TagSeoMetadata, TagSeoSource } from './tagSeo'

const getSiteUrl = (canonicalUrl: string) => {
  return canonicalUrl.split('/tag/')[0] ?? canonicalUrl
}

export const createTagStructuredData = (
  tag: TagSeoSource,
  metadata: TagSeoMetadata
) => {
  const siteUrl = getSiteUrl(metadata.canonicalUrl)

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CreativeWork',
        '@id': `${metadata.canonicalUrl}#tag`,
        url: metadata.canonicalUrl,
        name: tag.title,
        headline: tag.title,
        description: metadata.description,
        image: metadata.imageUrl,
        dateCreated: tag.createdAtIso,
        creator: tag.foundBy
          ? {
              '@type': 'Person',
              name: tag.foundBy
            }
          : undefined,
        isPartOf: {
          '@type': 'WebSite',
          name: 'Louisville Bike Tag',
          url: siteUrl
        }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: siteUrl
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Completed Tags',
            item: `${siteUrl}/tags`
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: tag.title,
            item: metadata.canonicalUrl
          }
        ]
      }
    ]
  }
}

export const serializeTagStructuredData = (value: unknown) => {
  return JSON.stringify(value).replaceAll('<', '\\u003c')
}
