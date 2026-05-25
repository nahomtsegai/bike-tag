export type AdminSubmissionStatus = 'pending' | 'approved' | 'rejected'

export type AdminImageType = 'matchPhoto' | 'nextTagPhoto'

export const formatStatus = (status: AdminSubmissionStatus) => {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export const formatAdminDate = (value: string | null) => {
  if (!value) {
    return 'Not available'
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

export const getStatusBadgeClass = (status: AdminSubmissionStatus) => {
  return {
    'status-pill-pending': status === 'pending',
    'status-pill-approved': status === 'approved',
    'status-pill-rejected': status === 'rejected'
  }
}

export const getImageErrorKey = (
  submissionId: string,
  imageType: AdminImageType
) => {
  return `${submissionId}:${imageType}`
}