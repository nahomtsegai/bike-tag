export type SubmitRequestPhotoIdentity = {
  name: string
  type: string
  size: number
  lastModified: number
}

export type SubmitRequestPayloadFingerprintInput = {
  riderName: string
  foundLocationMapUrl: string
  foundLatitude: number | null
  foundLongitude: number | null
  foundLocationAccuracyMeters: number | null
  foundLocationCapturedAt: string | null
  matchPhoto: SubmitRequestPhotoIdentity | null
  nextTitle: string
  nextClue: string
  nextHiddenLocationMapUrl: string
  nextHiddenLatitude: number | null
  nextHiddenLongitude: number | null
  nextHiddenLocationAccuracyMeters: number | null
  nextHiddenLocationCapturedAt: string | null
  nextPhoto: SubmitRequestPhotoIdentity | null
}

export type SubmitRequestAttempt = {
  clientSubmissionId: string
  payloadFingerprint: string
}

export type SubmitRequestAttemptSource = 'active' | 'stored' | 'created'

const submitRequestAttemptStorageKey = 'bikeTag.submitRequestAttempt.v1'
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const getSessionStorage = () => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

const normalizeText = (value: string) => value.trim()

const normalizePhotoIdentity = (
  photo: SubmitRequestPhotoIdentity | null
) => {
  if (!photo) {
    return null
  }

  return {
    name: photo.name,
    type: photo.type,
    size: photo.size,
    lastModified: photo.lastModified
  }
}

export const createSubmitRequestPayloadFingerprint = (
  payload: SubmitRequestPayloadFingerprintInput
) => {
  return JSON.stringify({
    riderName: normalizeText(payload.riderName),
    foundLocationMapUrl: normalizeText(payload.foundLocationMapUrl),
    foundLatitude: payload.foundLatitude,
    foundLongitude: payload.foundLongitude,
    foundLocationAccuracyMeters: payload.foundLocationAccuracyMeters,
    foundLocationCapturedAt: payload.foundLocationCapturedAt,
    matchPhoto: normalizePhotoIdentity(payload.matchPhoto),
    nextTitle: normalizeText(payload.nextTitle),
    nextClue: normalizeText(payload.nextClue),
    nextHiddenLocationMapUrl: normalizeText(
      payload.nextHiddenLocationMapUrl
    ),
    nextHiddenLatitude: payload.nextHiddenLatitude,
    nextHiddenLongitude: payload.nextHiddenLongitude,
    nextHiddenLocationAccuracyMeters:
      payload.nextHiddenLocationAccuracyMeters,
    nextHiddenLocationCapturedAt: payload.nextHiddenLocationCapturedAt,
    nextPhoto: normalizePhotoIdentity(payload.nextPhoto)
  })
}

export const isSubmitRequestAttempt = (
  value: unknown
): value is SubmitRequestAttempt => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const attempt = value as Record<string, unknown>

  return (
    typeof attempt.clientSubmissionId === 'string' &&
    uuidPattern.test(attempt.clientSubmissionId) &&
    typeof attempt.payloadFingerprint === 'string' &&
    Boolean(attempt.payloadFingerprint)
  )
}

export const saveSubmitRequestAttempt = (
  attempt: SubmitRequestAttempt
) => {
  const sessionStorage = getSessionStorage()

  if (!sessionStorage) {
    return
  }

  try {
    sessionStorage.setItem(
      submitRequestAttemptStorageKey,
      JSON.stringify(attempt)
    )
  } catch {
    // Retry idempotency still works in memory when browser storage is unavailable.
  }
}

export const loadSubmitRequestAttempt = () => {
  const sessionStorage = getSessionStorage()

  if (!sessionStorage) {
    return null
  }

  try {
    const savedAttempt = sessionStorage.getItem(
      submitRequestAttemptStorageKey
    )

    if (!savedAttempt) {
      return null
    }

    const parsedAttempt = JSON.parse(savedAttempt)

    if (!isSubmitRequestAttempt(parsedAttempt)) {
      sessionStorage.removeItem(submitRequestAttemptStorageKey)
      return null
    }

    return parsedAttempt
  } catch {
    return null
  }
}

export const clearSubmitRequestAttempt = () => {
  const sessionStorage = getSessionStorage()

  if (!sessionStorage) {
    return
  }

  try {
    sessionStorage.removeItem(submitRequestAttemptStorageKey)
  } catch {
    // Clearing browser storage is best effort.
  }
}

export const resolveSubmitRequestAttempt = ({
  currentAttempt,
  payloadFingerprint,
  createClientSubmissionId
}: {
  currentAttempt: SubmitRequestAttempt | null
  payloadFingerprint: string
  createClientSubmissionId: () => string
}): {
  attempt: SubmitRequestAttempt
  source: SubmitRequestAttemptSource
} => {
  if (currentAttempt) {
    return {
      attempt: currentAttempt,
      source: 'active'
    }
  }

  const storedAttempt = loadSubmitRequestAttempt()

  if (storedAttempt?.payloadFingerprint === payloadFingerprint) {
    return {
      attempt: storedAttempt,
      source: 'stored'
    }
  }

  const attempt = {
    clientSubmissionId: createClientSubmissionId(),
    payloadFingerprint
  }

  saveSubmitRequestAttempt(attempt)

  return {
    attempt,
    source: 'created'
  }
}
