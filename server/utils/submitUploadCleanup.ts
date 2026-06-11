type SubmitUploadCleanupInput = {
  uploadedStoragePaths: string[]
  submissionId: string | null
}

export const shouldCleanupSubmitUploads = ({
  uploadedStoragePaths,
  submissionId
}: SubmitUploadCleanupInput) => {
  return uploadedStoragePaths.length > 0 && submissionId === null
}

export const shouldSkipSubmitUploadCleanup = ({
  uploadedStoragePaths,
  submissionId
}: SubmitUploadCleanupInput) => {
  return uploadedStoragePaths.length > 0 && submissionId !== null
}