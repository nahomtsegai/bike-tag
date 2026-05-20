import { mockTags, type BikeTag } from '../../app/data/mockTags'

type SubmitTagToStoreInput = {
  riderName: string
  foundLocationMapUrl: string
  nextTitle: string
  nextClue: string
  nextHiddenLocationMapUrl: string
}

const maxStoredTags = 12

const tags = [...mockTags]

const createTodayLabel = () => {
  const today = new Date()

  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(today)
}

const createTagId = () => {
  return `tag_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

const trimTags = () => {
  tags.splice(maxStoredTags)
}

export const getCurrentTag = () => {
  return tags.find((tag) => {
    return tag.status === 'active'
  })
}

export const getFoundTags = () => {
  return tags.filter((tag) => {
    return tag.status === 'found'
  })
}

export const getTagById = (tagId?: string) => {
  return tags.find((tag) => {
    return tag.id === tagId
  })
}

export const submitTagToStore = (input: SubmitTagToStoreInput) => {
  const currentTag = getCurrentTag()

  if (!currentTag) {
    throw createError({
      statusCode: 404,
      statusMessage: 'No active tag found.'
    })
  }

  const submittedAt = createTodayLabel()
  const submittedAtIso = new Date().toISOString()

  currentTag.locationMapUrl = input.foundLocationMapUrl
  currentTag.foundBy = input.riderName
  currentTag.createdAt = submittedAt
  currentTag.status = 'found'

  const newCurrentTag: BikeTag = {
    id: createTagId(),
    title: input.nextTitle,
    clue: input.nextClue,
    imageUrl: '',
    hiddenLocationMapUrl: input.nextHiddenLocationMapUrl,
    foundBy: input.riderName,
    createdAt: submittedAt,
    createdAtIso: submittedAtIso,
    status: 'active'
  }

  tags.unshift(newCurrentTag)
  trimTags()

  return {
    currentTag: newCurrentTag,
    foundTag: currentTag
  }
}