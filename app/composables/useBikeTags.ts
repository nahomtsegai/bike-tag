import { computed, onMounted, ref } from 'vue'
import { mockTags, type BikeTag } from '../data/mockTags'

type SubmitTagInput = {
  riderName: string
  findLocationName: string
  nextTitle: string
  matchPhotoImageUrl: string
  nextPhotoImageUrl: string
}

type SubmitTagResult = {
  savedImages: boolean
}

const storageKey = 'bike-tag-local-tags'
const maxStoredTags = 12

const tags = ref<BikeTag[]>([...mockTags])
const hasLoadedLocalTags = ref(false)

const createTodayLabel = () => {
  const today = new Date()

  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(today)
}

const createTagId = () => {
  if (import.meta.client && window.crypto?.randomUUID) {
    return window.crypto.randomUUID()
  }

  return `tag-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const createStoredTag = (tag: BikeTag): BikeTag => {
  return {
    ...tag,
    createdAtIso: tag.createdAtIso || new Date(tag.createdAt).toISOString()
  }
}

const trimStoredTags = (nextTags: BikeTag[]): BikeTag[] => {
  return nextTags.slice(0, maxStoredTags)
}

const removeImagesFromTags = (nextTags: BikeTag[]): BikeTag[] => {
  return nextTags.map((tag) => ({
    ...tag,
    imageUrl: ''
  }))
}

const loadTagsFromStorage = () => {
  if (!import.meta.client || hasLoadedLocalTags.value) {
    return
  }

  try {
    const storedTags = window.localStorage.getItem(storageKey)

    if (storedTags) {
      const parsedTags = JSON.parse(storedTags) as BikeTag[]
      tags.value = parsedTags.map(createStoredTag)
    }
  } catch {
    tags.value = [...mockTags]
    window.localStorage.removeItem(storageKey)
  }

  hasLoadedLocalTags.value = true
}

const saveTagsToStorage = (nextTags: BikeTag[]) => {
  if (!import.meta.client) {
    return true
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(nextTags))
    return true
  } catch {
    return false
  }
}

export const useBikeTags = () => {
  onMounted(() => {
    loadTagsFromStorage()
  })

  const currentTag = computed(() => {
    return tags.value.find((tag) => tag.status === 'active') ?? tags.value[0]
  })

  const foundTags = computed(() => {
    return tags.value.filter((tag) => tag.status === 'found')
  })

  const getTagById = (id: string) => {
    return computed(() => {
      return tags.value.find((tag) => tag.id === id)
    })
  }

  const addClueToCurrentTag = (clue: string) => {
    const trimmedClue = clue.trim()

    if (!trimmedClue) {
      return false
    }

    const clueAddedAt = createTodayLabel()

    const nextTags: BikeTag[] = tags.value.map((tag) => {
      if (tag.status !== 'active') {
        return tag
      }

      return {
        ...tag,
        clue: trimmedClue,
        clueAddedAt
      }
    })

    tags.value = nextTags

    const savedWithImages = saveTagsToStorage(nextTags)

    if (savedWithImages) {
      return true
    }

    const textOnlyTags = removeImagesFromTags(nextTags)

    tags.value = textOnlyTags
    saveTagsToStorage(textOnlyTags)

    return true
  }

  const submitTag = (input: SubmitTagInput): SubmitTagResult => {
    const submittedAt = createTodayLabel()
    const submittedAtIso = new Date().toISOString()

    const updatedExistingTags: BikeTag[] = tags.value.map((tag) => {
      if (tag.status !== 'active') {
        return tag
      }

      return {
        ...tag,
        imageUrl: input.matchPhotoImageUrl,
        locationName: input.findLocationName,
        foundBy: input.riderName,
        createdAt: submittedAt,
        createdAtIso: tag.createdAtIso || submittedAtIso,
        status: 'found' as const
      }
    })

    const newCurrentTag: BikeTag = {
      id: createTagId(),
      title: input.nextTitle,
      clue: '',
      imageUrl: input.nextPhotoImageUrl,
      locationName: '',
      foundBy: input.riderName,
      createdAt: submittedAt,
      createdAtIso: submittedAtIso,
      status: 'active'
    }

    const nextTags = trimStoredTags([newCurrentTag, ...updatedExistingTags])

    tags.value = nextTags

    const savedWithImages = saveTagsToStorage(nextTags)

    if (savedWithImages) {
      return {
        savedImages: true
      }
    }

    const textOnlyTags = removeImagesFromTags(nextTags)

    tags.value = textOnlyTags
    saveTagsToStorage(textOnlyTags)

    return {
      savedImages: false
    }
  }

  const resetLocalTags = () => {
    tags.value = [...mockTags]

    if (import.meta.client) {
      window.localStorage.removeItem(storageKey)
    }
  }

  return {
    currentTag,
    foundTags,
    getTagById,
    addClueToCurrentTag,
    submitTag,
    resetLocalTags
  }
}