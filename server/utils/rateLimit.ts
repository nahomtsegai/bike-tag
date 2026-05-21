type RateLimitOptions = {
  key: string
  limit: number
  windowMs: number
}

type RateLimitEntry = {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

const getNow = () => {
  return Date.now()
}

const cleanExpiredRateLimits = () => {
  const now = getNow()

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key)
    }
  }
}

export const assertRateLimit = ({
  key,
  limit,
  windowMs
}: RateLimitOptions) => {
  cleanExpiredRateLimits()

  const now = getNow()
  const existingEntry = rateLimitStore.get(key)

  if (!existingEntry || existingEntry.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs
    })

    return
  }

  if (existingEntry.count >= limit) {
    const retryAfterSeconds = Math.ceil((existingEntry.resetAt - now) / 1000)

    throw createError({
      statusCode: 429,
      statusMessage: `Too many submit attempts. Try again in ${retryAfterSeconds} seconds.`
    })
  }

  existingEntry.count += 1
}