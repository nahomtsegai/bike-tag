import { describe, expect, it } from 'vitest'

import {
  createTagDescription,
  createTagSeoMetadata
} from '../../app/utils/tagSeo'
import {
  createTagStructuredData,
  serializeTagStructuredData
} from '../../app/utils/tagStructuredData'

const siteUrl = 'https://www.louisvillebiketag.com'

const foundTag = {
  title: "Lion's Den",
  clue: 'A lion watches over this park.',
  imageUrl: 'https://images.example.com/lions-den.jpg',
  foundBy: 'Nahom',
  createdAt: '06/06/2026',
  createdAtIso: '2026-06-06T22:09:55.352Z',
  status: 'found' as const
}

describe('tag SEO metadata', () => {
  it('uses tag content for found-tag metadata', () => {
    const metadata = createTagSeoMetadata(foundTag, siteUrl, 'tag-123')

    expect(metadata).toEqual({
      title: "Lion's Den | Louisville Bike Tag",
      description:
        "Lion's Den was found by Nahom on 06/06/2026. Clue: A lion watches over this park.",
      canonicalUrl: `${siteUrl}/tag/tag-123`,
      imageUrl: foundTag.imageUrl,
      imageAlt: "Lion's Den Bike Tag photo",
      robots: 'index, follow'
    })
  })

  it('keeps missing tags out of search results', () => {
    const metadata = createTagSeoMetadata(null, siteUrl, 'missing-tag')

    expect(metadata.title).toBe('Tag Not Found | Louisville Bike Tag')
    expect(metadata.canonicalUrl).toBe(`${siteUrl}/tag/missing-tag`)
    expect(metadata.imageUrl).toBe(`${siteUrl}/og-image.png`)
    expect(metadata.robots).toBe('noindex, nofollow')
  })

  it('does not invent a locked clue for active tags', () => {
    const description = createTagDescription({
      title: 'Mystery Bridge',
      imageUrl: '/tag-photo.jpg',
      foundBy: 'Admin',
      createdAt: '06/19/2026',
      createdAtIso: '2026-06-19T12:00:00.000Z',
      status: 'active'
    })

    expect(description).toBe(
      'Mystery Bridge is the current Louisville Bike Tag. Ride out and find the mystery location.'
    )
    expect(description).not.toContain('Clue:')
  })

  it('creates structured data with breadcrumbs and safely serializes markup', () => {
    const metadata = createTagSeoMetadata(foundTag, siteUrl, 'tag-123')
    const structuredData = createTagStructuredData(
      {
        ...foundTag,
        clue: 'Look near the <bridge>.'
      },
      metadata
    )

    expect(structuredData['@graph'][0]).toMatchObject({
      '@type': 'CreativeWork',
      name: "Lion's Den",
      image: foundTag.imageUrl,
      creator: {
        '@type': 'Person',
        name: 'Nahom'
      }
    })
    expect(structuredData['@graph'][1]).toMatchObject({
      '@type': 'BreadcrumbList',
      itemListElement: [
        expect.objectContaining({ name: 'Home' }),
        expect.objectContaining({ name: 'Completed Tags' }),
        expect.objectContaining({ name: "Lion's Den" })
      ]
    })

    expect(serializeTagStructuredData(structuredData)).not.toContain('<bridge>')
    expect(serializeTagStructuredData(structuredData)).toContain('\\u003cbridge>')
  })
})
