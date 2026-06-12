import type { H3Event } from 'h3'
import { getHeader } from 'h3'

type RateLimitOptions = {
  key: string
  limit: number
  windowMs: number
  messagePrefix?: string
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

export const getClientIpAddress = (event: H3Event) => {
  const forwardedFor = getHeader(event, 'x-forwarded-for')

  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown'
  }

  return getHeader(event, 'x-real-ip') || 'unknown'
}

export const getPositiveNumberConfig = (
  value: unknown,
  fallbackValue: number
) => {
  const numericValue = typeof value === 'number' ? value : Number(value)

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return fallbackValue
  }

  return numericValue
}

export const assertRateLimit = ({
  key,
  limit,
  windowMs,
  messagePrefix = 'Too many submit attempts.'
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
      statusMessage: `${messagePrefix} Try again in ${retryAfterSeconds} seconds.`
    })
  }

  existingEntry.count += 1
}

export const clearRateLimitStore = () => {
  rateLimitStore.clear()
}