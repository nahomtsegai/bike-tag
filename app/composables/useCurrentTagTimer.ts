import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const secondInMilliseconds = 1000
const minuteInSeconds = 60
const hourInSeconds = 60 * minuteInSeconds
const dayInSeconds = 24 * hourInSeconds

const formatElapsedTime = (elapsedMilliseconds: number) => {
  const elapsedSeconds = Math.max(
    0,
    Math.floor(elapsedMilliseconds / secondInMilliseconds)
  )

  const days = Math.floor(elapsedSeconds / dayInSeconds)
  const hours = Math.floor((elapsedSeconds % dayInSeconds) / hourInSeconds)
  const minutes = Math.floor((elapsedSeconds % hourInSeconds) / minuteInSeconds)
  const seconds = elapsedSeconds % minuteInSeconds

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

export const useCurrentTagTimer = (createdAtIso: string) => {
  const now = ref(new Date())
  let intervalId: ReturnType<typeof window.setInterval> | undefined

  const elapsedLabel = computed(() => {
    const createdAt = new Date(createdAtIso)
    const elapsedMilliseconds = now.value.getTime() - createdAt.getTime()

    return formatElapsedTime(elapsedMilliseconds)
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
    elapsedLabel
  }
}