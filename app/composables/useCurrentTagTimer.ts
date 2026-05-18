import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  toValue,
  type MaybeRefOrGetter
} from 'vue'

const secondInMilliseconds = 1000
const minuteInSeconds = 60
const hourInSeconds = 60 * minuteInSeconds
const dayInSeconds = 24 * hourInSeconds
const clueRevealDelayInSeconds = 5 * dayInSeconds

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
  createdAtIso: MaybeRefOrGetter<string>
) => {
  const now = ref(new Date())
  let intervalId: ReturnType<typeof window.setInterval> | undefined

  const elapsedSeconds = computed(() => {
    const createdAt = new Date(toValue(createdAtIso))
    const elapsedMilliseconds = now.value.getTime() - createdAt.getTime()

    return Math.max(0, Math.floor(elapsedMilliseconds / secondInMilliseconds))
  })

  const elapsedLabel = computed(() => {
    return formatDuration(elapsedSeconds.value)
  })

  const hasClueUnlocked = computed(() => {
    return elapsedSeconds.value >= clueRevealDelayInSeconds
  })

  const clueUnlocksInLabel = computed(() => {
    return formatDuration(clueRevealDelayInSeconds - elapsedSeconds.value)
  })

  onMounted(() => {
    intervalId = window.setInterval(() => {
      now.value = new Date()
    }, secondInMilliseconds)
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