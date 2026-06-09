import { getAdminAuthHeaders } from './adminTokenStorage'

export type DeleteAdminSubmissionInput = {
  submissionId: string
}

export type DeleteAdminSubmissionResponse = {
  success: true
  submissionId: string
}

const getDeleteSubmissionErrorMessage = (error: unknown) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'statusMessage' in error &&
    typeof error.statusMessage === 'string'
  ) {
    return error.statusMessage
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'data' in error &&
    typeof error.data === 'object' &&
    error.data !== null &&
    'statusMessage' in error.data &&
    typeof error.data.statusMessage === 'string'
  ) {
    return error.data.statusMessage
  }

  return 'Could not delete this submission. Try again.'
}

export const deleteAdminSubmission = async ({
  submissionId
}: DeleteAdminSubmissionInput) => {
  try {
    return await $fetch<DeleteAdminSubmissionResponse>(
      `/api/admin/submissions/${submissionId}/delete`,
      {
        method: 'POST',
        headers: getAdminAuthHeaders()
      }
    )
  } catch (error) {
    throw new Error(getDeleteSubmissionErrorMessage(error))
  }
}