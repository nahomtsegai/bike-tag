export type SubmitTagDraft = {
  riderName: string
  foundLocationMapUrl: string
  foundLatitude: number | null
  foundLongitude: number | null
  foundLocationAccuracyMeters: number | null
  foundLocationCapturedAt: string | null
  nextTitle: string
  nextClue: string
  nextHiddenLocationMapUrl: string
  nextHiddenLatitude: number | null
  nextHiddenLongitude: number | null
  nextHiddenLocationAccuracyMeters: number | null
  nextHiddenLocationCapturedAt: string | null
}

const submitTagDraftStorageKey = 'bikeTag.submitDraft.v1'

const getLocalStorage = () => {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage
}

const isNullableNumber = (value: unknown): value is number | null => {
  return value === null || typeof value === 'number'
}

const isNullableString = (value: unknown): value is string | null => {
  return value === null || typeof value === 'string'
}

export const createEmptySubmitTagDraft = (): SubmitTagDraft => {
  return {
    riderName: '',
    foundLocationMapUrl: '',
    foundLatitude: null,
    foundLongitude: null,
    foundLocationAccuracyMeters: null,
    foundLocationCapturedAt: null,
    nextTitle: '',
    nextClue: '',
    nextHiddenLocationMapUrl: '',
    nextHiddenLatitude: null,
    nextHiddenLongitude: null,
    nextHiddenLocationAccuracyMeters: null,
    nextHiddenLocationCapturedAt: null
  }
}

export const isSubmitTagDraft = (value: unknown): value is SubmitTagDraft => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const draft = value as Record<string, unknown>

  return (
    typeof draft.riderName === 'string' &&
    typeof draft.foundLocationMapUrl === 'string' &&
    isNullableNumber(draft.foundLatitude) &&
    isNullableNumber(draft.foundLongitude) &&
    isNullableNumber(draft.foundLocationAccuracyMeters) &&
    isNullableString(draft.foundLocationCapturedAt) &&
    typeof draft.nextTitle === 'string' &&
    typeof draft.nextClue === 'string' &&
    typeof draft.nextHiddenLocationMapUrl === 'string' &&
    isNullableNumber(draft.nextHiddenLatitude) &&
    isNullableNumber(draft.nextHiddenLongitude) &&
    isNullableNumber(draft.nextHiddenLocationAccuracyMeters) &&
    isNullableString(draft.nextHiddenLocationCapturedAt)
  )
}

export const saveSubmitTagDraft = (draft: SubmitTagDraft) => {
  const localStorage = getLocalStorage()

  if (!localStorage) {
    return
  }

  localStorage.setItem(submitTagDraftStorageKey, JSON.stringify(draft))
}

export const loadSubmitTagDraft = () => {
  const localStorage = getLocalStorage()

  if (!localStorage) {
    return null
  }

  const savedDraft = localStorage.getItem(submitTagDraftStorageKey)

  if (!savedDraft) {
    return null
  }

  try {
    const parsedDraft = JSON.parse(savedDraft)

    if (!isSubmitTagDraft(parsedDraft)) {
      return null
    }

    return parsedDraft
  } catch {
    return null
  }
}

export const clearSubmitTagDraft = () => {
  const localStorage = getLocalStorage()

  if (!localStorage) {
    return
  }

  localStorage.removeItem(submitTagDraftStorageKey)
}