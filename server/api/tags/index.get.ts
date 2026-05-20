import { mockTags } from '../../../app/data/mockTags'

export default defineEventHandler(() => {
  return mockTags
    .filter((tag) => {
      return tag.status === 'found'
    })
    .map((tag) => {
      return {
        id: tag.id,
        title: tag.title,
        clue: tag.clue,
        imageUrl: tag.imageUrl,
        locationMapUrl: tag.locationMapUrl,
        foundBy: tag.foundBy,
        createdAt: tag.createdAt,
        createdAtIso: tag.createdAtIso,
        status: tag.status
      }
    })
})