type SubmissionReferenceStorage = Pick<
  Storage,
  'getItem' | 'setItem' | 'removeItem'
>

const latestSubmissionReferenceStorageKey =
  'bikeTag.latestSubmissionReference'

const getBrowserStorage = () => {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage
}

export const saveLatestSubmissionReference = (
  referenceCode: string,
  storage: SubmissionReferenceStorage | null = getBrowserStorage()
) => {
  const normalizedReferenceCode = referenceCode.trim()

  if (!normalizedReferenceCode || !storage) {
    return
  }

  storage.setItem(
    latestSubmissionReferenceStorageKey,
    normalizedReferenceCode
  )
}

export const getLatestSubmissionReference = (
  storage: SubmissionReferenceStorage | null = getBrowserStorage()
) => {
  if (!storage) {
    return ''
  }

  return storage.getItem(latestSubmissionReferenceStorageKey) ?? ''
}

export const clearLatestSubmissionReference = (
  storage: SubmissionReferenceStorage | null = getBrowserStorage()
) => {
  if (!storage) {
    return
  }

  storage.removeItem(latestSubmissionReferenceStorageKey)
}