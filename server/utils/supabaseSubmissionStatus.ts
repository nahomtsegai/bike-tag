import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  PublicSubmissionStatus,
  PublicSubmissionStatusResponse
} from '~~/shared/types/submissionStatus'

type SubmissionStatusRow = {
  id: string
  status: string
  created_at: string
  reviewed_at: string | null
  rider_name: string
  next_title: string
  rejection_reason: string | null
}

const allowedStatuses: PublicSubmissionStatus[] = [
  'pending',
  'approved',
  'rejected',
  'superseded'
]

const isPublicSubmissionStatus = (
  status: string
): status is PublicSubmissionStatus => {
  return allowedStatuses.includes(status as PublicSubmissionStatus)
}

export const getPublicSubmissionStatus = async (
  supabase: SupabaseClient,
  submissionId: string
): Promise<PublicSubmissionStatusResponse | null> => {
  const { data, error } = await supabase
    .from('submissions')
    .select(
      [
        'id',
        'status',
        'created_at',
        'reviewed_at',
        'rider_name',
        'next_title',
        'rejection_reason'
      ].join(',')
    )
    .eq('id', submissionId)
    .maybeSingle<SubmissionStatusRow>()

  if (error) {
    throw new Error(
      `Could not load submission status from Supabase: ${error.message}`
    )
  }

  if (!data) {
    return null
  }

  if (!isPublicSubmissionStatus(data.status)) {
    throw new Error(`Unexpected submission status: ${data.status}`)
  }

  return {
    id: data.id,
    status: data.status,
    submittedAt: data.created_at,
    reviewedAt: data.reviewed_at,
    riderName: data.rider_name,
    nextTitle: data.next_title,
    reviewNote:
      data.status === 'rejected' || data.status === 'superseded'
        ? data.rejection_reason
        : null
  }
}
