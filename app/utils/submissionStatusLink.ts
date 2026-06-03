export const buildSubmissionStatusUrl = (
  referenceCode: string,
  origin?: string
) => {
  if (!referenceCode) {
    return ''
  }

  const statusPath = '/submission-status'
  const params = new URLSearchParams({
    reference: referenceCode
  })

  if (!origin) {
    return `${statusPath}?${params.toString()}`
  }

  const url = new URL(statusPath, origin)

  url.searchParams.set('reference', referenceCode)

  return url.toString()
}