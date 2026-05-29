import type { AdminSubmissionStatus } from '~/utils/adminSubmissions'

export type AdminSubmissionSummary = {
  pending: number
  approved: number
  rejected: number
}

export type AdminSubmission = {
  id: string
  activeTagId: string
  riderName: string
  foundLocationMapUrl: string
  matchPhotoUrl: string
  nextTitle: string
  nextClue: string
  nextHiddenLocationMapUrl: string
  nextTagPhotoUrl: string
  foundLatitude: number | null
  foundLongitude: number | null
  foundLocationAccuracyMeters: number | null
  foundLocationCapturedAt: string | null
  status: AdminSubmissionStatus
  rejectionReason: string | null
  reviewedAt: string | null
  reviewedBy: string | null
  createdAt: string
  updatedAt: string
}

export type AdminSubmissionsResponse = {
  success: boolean
  submissions: AdminSubmission[]
  summary: AdminSubmissionSummary
  pagination: {
    limit: number
    offset: number
    count: number
    hasMore: boolean
  }
}

export type AdminSubmissionDetailResponse = {
  success: boolean
  submission: AdminSubmission
}

export type ApproveSubmissionResponse = {
  success: boolean
  message: string
  submissionId: string
  foundTagId: string
}

export type RejectSubmissionResponse = {
  success: boolean
  message: string
  submissionId: string
  status: 'rejected'
}