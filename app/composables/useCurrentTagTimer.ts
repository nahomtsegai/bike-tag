import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  toValue,
  type MaybeRefOrGetter
} from 'vue'

import { resolveClueUnlocksAtIso } from '~~/shared/utils/clueUnlock'

const secondInMilliseconds = 1000
const minuteInSeconds = 60
const hourInSeconds = 60 * minuteInSeconds
const dayInSeconds = 24 * hourInSeconds

type CurrentTagTimingResponse = {
  currentTag: {
    createdAtIso: string
    clueUnlocksAtIso: string
  } | null
}

const formatDuration = (totalSeconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))

  const days = Math.floor(safeSeconds / dayInSeconds)
  const hours = Math.floor((safeSeconds % dayInSeconds) / hourInSeconds)
  const minutes = Math.floor((safeSeconds % hourInSeconds) / minuteInSeconds)
  const seconds = safeSeconds % minuteInSeconds

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${seconds}s`
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }

  return `${seconds}s`
}

export const useCurrentTagTimer = (
  createdAtIso: MaybeRefOrGetter<string>,
  clueUnlocksAtIso?: MaybeRefOrGetter<string | undefined>
) => {
  const now = ref(new Date())
  const loadedClueUnlocksAtIso = ref<string>()
  let intervalId: ReturnType<typeof window.setInterval> | undefined

  const resolvedClueUnlocksAtIso = computed(() => {
    const providedClueUnlocksAtIso = clueUnlocksAtIso
      ? toValue(clueUnlocksAtIso)
      : undefined

    return resolveClueUnlocksAtIso({
      createdAtIso: toValue(createdAtIso),
      clueUnlocksAtIso:
        providedClueUnlocksAtIso ?? loadedClueUnlocksAtIso.value
    })
  })

  const elapsedSeconds = computed(() => {
    const createdAt = new Date(toValue(createdAtIso))
    const elapsedMilliseconds = now.value.getTime() - createdAt.getTime()

    return Math.max(0, Math.floor(elapsedMilliseconds / secondInMilliseconds))
  })

  const clueUnlockTime = computed(() => {
    return new Date(resolvedClueUnlocksAtIso.value).getTime()
  })

  const elapsedLabel = computed(() => {
    return formatDuration(elapsedSeconds.value)
  })

  const hasClueUnlocked = computed(() => {
    return now.value.getTime() >= clueUnlockTime.value
  })

  const clueUnlocksInLabel = computed(() => {
    const remainingMilliseconds = clueUnlockTime.value - now.value.getTime()

    return formatDuration(remainingMilliseconds / secondInMilliseconds)
  })

  const loadCurrentTagTiming = async () => {
    if (clueUnlocksAtIso && toValue(clueUnlocksAtIso)) {
      return
    }

    try {
      const response = await $fetch<CurrentTagTimingResponse>('/api/tags/current')

      if (response.currentTag?.createdAtIso === toValue(createdAtIso)) {
        loadedClueUnlocksAtIso.value = response.currentTag.clueUnlocksAtIso
      }
    } catch {
      // Keep the default five-day fallback if timing metadata cannot be refreshed.
    }
  }

  onMounted(() => {
    intervalId = window.setInterval(() => {
      now.value = new Date()
    }, secondInMilliseconds)

    void loadCurrentTagTiming()
  })

  onBeforeUnmount(() => {
    if (intervalId) {
      window.clearInterval(intervalId)
    }
  })

  return {
    elapsedLabel,
    hasClueUnlocked,
    clueUnlocksInLabel
  }
}
