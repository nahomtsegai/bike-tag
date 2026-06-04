export type AdminApiError = {
  statusCode?: number
  statusMessage?: string
  message?: string
}

type GetAdminApiErrorMessageOptions = {
  onAuthFailure?: () => void
}

export const isAdminApiError = (error: unknown): error is AdminApiError => {
  return typeof error === 'object' && error !== null
}

export const getAdminApiErrorMessage = (
  error: unknown,
  options: GetAdminApiErrorMessageOptions = {}
) => {
  if (isAdminApiError(error) && error.statusCode === 403) {
    options.onAuthFailure?.()

    return 'Your admin session expired. Please log in again.'
  }

  if (isAdminApiError(error) && error.statusCode === 400) {
    return (
      error.statusMessage ||
      error.message ||
      'The request is invalid. Check your filters and try again.'
    )
  }

  if (isAdminApiError(error) && error.statusMessage) {
    return error.statusMessage
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Could not load submissions.'
}