import { computed, onMounted, ref } from 'vue'
import { mockTags, type BikeTag } from '../data/mockTags'

type SubmitTagInput = {
  riderName: string
  findLocationName: string
  nextTitle: string
}

const storageKey = 'bike-tag-local-tags'

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

const loadTagsFromStorage = () => {
  if (!import.meta.client || hasLoadedLocalTags.value) {
    return
  }

  try {
    const storedTags = window.localStorage.getItem(storageKey)

    if (storedTags) {
      tags.value = JSON.parse(storedTags) as BikeTag[]
    }
  } catch {
    tags.value = [...mockTags]
    window.localStorage.removeItem(storageKey)
  }

  hasLoadedLocalTags.value = true
}

const saveTagsToStorage = () => {
  if (!import.meta.client) {
    return
  }

  window.localStorage.setItem(storageKey, JSON.stringify(tags.value))
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

  const submitTag = (input: SubmitTagInput) => {
    const submittedAt = createTodayLabel()

    tags.value = tags.value.map((tag) => {
      if (tag.status !== 'active') {
        return tag
      }

      return {
        ...tag,
        locationName: input.findLocationName,
        foundBy: input.riderName,
        createdAt: submittedAt,
        status: 'found'
      }
    })

    const newCurrentTag: BikeTag = {
      id: createTagId(),
      title: input.nextTitle,
      clue: 'Photo clue submitted locally. Image storage will come in a later phase.',
      imageUrl: '',
      locationName: '',
      foundBy: input.riderName,
      createdAt: submittedAt,
      status: 'active'
    }

    tags.value = [newCurrentTag, ...tags.value]

    saveTagsToStorage()
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
    submitTag,
    resetLocalTags
  }
}