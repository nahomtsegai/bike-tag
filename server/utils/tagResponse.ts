import type { BikeTag } from '../../app/data/mockTags'
import { getClueVisibility } from './tagVisibility'

export const createCurrentTagResponse = (tag: BikeTag) => {
  const { clueIsUnlocked, clueUnlocksAtIso } = getClueVisibility(
    tag.createdAtIso,
    tag.clueUnlocksAtIso
  )

  return {
    id: tag.id,
    title: tag.title,
    imageUrl: tag.imageUrl,
    foundBy: tag.foundBy,
    createdAt: tag.createdAt,
    createdAtIso: tag.createdAtIso,
    status: tag.status,
    clue: clueIsUnlocked ? tag.clue : undefined,
    clueIsUnlocked,
    clueUnlocksAtIso
  }
}

export const createFoundTagResponse = (tag: BikeTag) => {
  return {
    id: tag.id,
    title: tag.title,
    clue: tag.clue,
    imageUrl: tag.imageUrl,
    locationMapUrl: tag.locationMapUrl,
    foundBy: tag.foundBy,
    createdAt: tag.createdAt,
    createdAtIso: tag.createdAtIso,
    status: tag.status,
    foundLatitude: tag.foundLatitude,
    foundLongitude: tag.foundLongitude,
    foundLocationAccuracyMeters: tag.foundLocationAccuracyMeters,
    foundLocationCapturedAt: tag.foundLocationCapturedAt
  }
}
