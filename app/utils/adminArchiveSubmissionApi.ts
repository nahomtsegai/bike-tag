export type ArchiveAdminSubmissionInput = {
  submissionId: string
  headers: HeadersInit
}

export type ArchiveAdminSubmissionResponse = {
  success: true
  submissionId: string
  archivedAt: string
}

const getArchiveSubmissionErrorMessage = (error: unknown) => {
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

  return 'Could not archive this submission. Try again.'
}

export const archiveAdminSubmission = async ({
  submissionId,
  headers
}: ArchiveAdminSubmissionInput) => {
  try {
    return await $fetch<ArchiveAdminSubmissionResponse>(
      `/api/admin/submissions/${submissionId}/archive`,
      {
        method: 'POST',
        headers
      }
    )
  } catch (error) {
    throw new Error(getArchiveSubmissionErrorMessage(error))
  }
}