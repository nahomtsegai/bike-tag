export type SubmitTagFormErrors = {
  riderName?: string
  findLocationMapUrl?: string
  matchPhoto?: string
  nextTitle?: string
  nextClue?: string
  nextHiddenLocationMapUrl?: string
  nextPhoto?: string
}

export type SubmitTagErrorField = keyof SubmitTagFormErrors

export const submitTagErrorFieldOrder: SubmitTagErrorField[] = [
  'riderName',
  'findLocationMapUrl',
  'matchPhoto',
  'nextTitle',
  'nextClue',
  'nextHiddenLocationMapUrl',
  'nextPhoto'
]

export const getFirstSubmitTagErrorField = (
  errors: SubmitTagFormErrors
): SubmitTagErrorField | null => {
  return submitTagErrorFieldOrder.find((fieldName) => {
    return Boolean(errors[fieldName])
  }) ?? null
}

export const getSubmitTagValidationSummary = (
  errors: SubmitTagFormErrors
) => {
  const errorCount = Object.values(errors).filter(Boolean).length

  if (errorCount === 0) {
    return ''
  }

  if (errorCount === 1) {
    return 'Please fix 1 field before reviewing your submission.'
  }

  return `Please fix ${errorCount} fields before reviewing your submission.`
}