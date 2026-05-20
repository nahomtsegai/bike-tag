import { mockTags } from '../../../app/data/mockTags'
import { getClueVisibility } from '../../utils/tagVisibility'

export default defineEventHandler(() => {
  const activeTag = mockTags.find((tag) => {
    return tag.status === 'active'
  })

  if (!activeTag) {
    throw createError({
      statusCode: 404,
      statusMessage: 'No active tag found.'
    })
  }

  const { clueIsUnlocked, clueUnlocksAtIso } = getClueVisibility(
    activeTag.createdAtIso
  )

  return {
    id: activeTag.id,
    title: activeTag.title,
    imageUrl: activeTag.imageUrl,
    foundBy: activeTag.foundBy,
    createdAt: activeTag.createdAt,
    createdAtIso: activeTag.createdAtIso,
    status: activeTag.status,
    clue: clueIsUnlocked ? activeTag.clue : undefined,
    clueIsUnlocked,
    clueUnlocksAtIso
  }
})