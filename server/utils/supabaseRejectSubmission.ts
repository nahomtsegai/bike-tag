import { createSupabaseServerClient } from './supabase'
import {
  deleteBikeTagPhotos,
  deletePendingBikeTagPhotos,
  getStoragePathFromPublicUrl
} from './supabaseStorage'

type RejectSubmissionInput = {
  submissionId: string
  reviewedBy: string
  rejectionReason?: string
}

type RejectSubmissionRpcResponse = {
  submission_id: string
}

type SubmissionPhotoReferences = {
  match_photo_url: string | null
  match_photo_storage_path: string | null
  next_tag_photo_url: string | null
  next_tag_photo_storage_path: string | null
}

type RejectedSubmissionStoragePaths = {
  publicStoragePaths: string[]
  pendingStoragePaths: string[]
}

const rejectSubmissionErrorMap = {
  SUBMISSION_ID_REQUIRED: {
    statusCode: 400,
    statusMessage: 'Submission id is required.'
  },
  REVIEWER_REQUIRED: {
    statusCode: 400,
    statusMessage: 'Reviewer is required.'
  },
  REJECTION_REASON_TOO_LONG: {
    statusCode: 400,
    statusMessage: 'Rejection reason is too long.'
  },
  SUBMISSION_NOT_FOUND: {
    statusCode: 404,
    statusMessage: 'Submission was not found.'
  },
  SUBMISSION_NOT_PENDING: {
    statusCode: 409,
    statusMessage: 'Submission has already been reviewed.'
  },
  SUBMISSION_REJECT_FAILED: {
    statusCode: 409,
    statusMessage: 'Could not reject submission.'
  }
} as const

const createRejectSubmissionError = (message: string) => {
  return createError({
    statusCode: 500,
    statusMessage: message
  })
}

const createMappedRejectSubmissionError = (errorMessage: string) => {
  const mappedError =
    rejectSubmissionErrorMap[
      errorMessage as keyof typeof rejectSubmissionErrorMap
    ]

  if (!mappedError) {
    return createRejectSubmissionError(
      `Could not reject submission in Supabase: ${errorMessage}`
    )
  }

  return createError(mappedError)
}

const isRejectSubmissionRpcResponse = (
  value: unknown
): value is RejectSubmissionRpcResponse => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'submission_id' in value &&
    typeof value.submission_id === 'string'
  )
}

const isSubmissionPhotoReferences = (
  value: unknown
): value is SubmissionPhotoReferences => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'match_photo_url' in value &&
    (typeof value.match_photo_url === 'string' ||
      value.match_photo_url === null) &&
    'match_photo_storage_path' in value &&
    (typeof value.match_photo_storage_path === 'string' ||
      value.match_photo_storage_path === null) &&
    'next_tag_photo_url' in value &&
    (typeof value.next_tag_photo_url === 'string' ||
      value.next_tag_photo_url === null) &&
    'next_tag_photo_storage_path' in value &&
    (typeof value.next_tag_photo_storage_path === 'string' ||
      value.next_tag_photo_storage_path === null)
  )
}

const getRejectedSubmissionStoragePaths = async (
  submissionId: string
): Promise<RejectedSubmissionStoragePaths> => {
  const supabase = createSupabaseServerClient()

  const { data, error } = await supabase
    .from('submissions')
    .select(
      [
        'match_photo_url',
        'match_photo_storage_path',
        'next_tag_photo_url',
        'next_tag_photo_storage_path'
      ].join(',')
    )
    .eq('id', submissionId)
    .single()

  if (error) {
    throw createRejectSubmissionError(
      `Could not load submission photos before rejection: ${error.message}`
    )
  }

  if (!isSubmissionPhotoReferences(data)) {
    throw createRejectSubmissionError(
      'Submission photos returned an unexpected response.'
    )
  }

  return {
    publicStoragePaths: [
      getStoragePathFromPublicUrl(data.match_photo_url ?? ''),
      getStoragePathFromPublicUrl(data.next_tag_photo_url ?? '')
    ].filter(Boolean),
    pendingStoragePaths: [
      data.match_photo_storage_path?.trim() ?? '',
      data.next_tag_photo_storage_path?.trim() ?? ''
    ].filter(Boolean)
  }
}

const cleanupRejectedSubmissionPhotos = async (
  submissionId: string,
  storagePaths: RejectedSubmissionStoragePaths
) => {
  if (storagePaths.publicStoragePaths.length) {
    try {
      await deleteBikeTagPhotos(storagePaths.publicStoragePaths)
    } catch (error) {
      console.error('Could not delete rejected public submission photos.', {
        submissionId,
        storagePaths: storagePaths.publicStoragePaths,
        error
      })
    }
  }

  if (storagePaths.pendingStoragePaths.length) {
    try {
      await deletePendingBikeTagPhotos(storagePaths.pendingStoragePaths)
    } catch (error) {
      console.error('Could not delete rejected private submission photos.', {
        submissionId,
        storagePaths: storagePaths.pendingStoragePaths,
        error
      })
    }
  }
}

export const rejectSubmissionInSupabase = async ({
  submissionId,
  reviewedBy,
  rejectionReason
}: RejectSubmissionInput) => {
  const rejectedSubmissionStoragePaths =
    await getRejectedSubmissionStoragePaths(submissionId)

  const supabase = createSupabaseServerClient()

  const { data, error } = await supabase.rpc('reject_submission', {
    p_submission_id: submissionId,
    p_reviewed_by: reviewedBy,
    p_rejection_reason: rejectionReason ?? null
  })

  if (error) {
    throw createMappedRejectSubmissionError(error.message)
  }

  if (!Array.isArray(data)) {
    throw createRejectSubmissionError(
      'Supabase reject submission function returned an unexpected response.'
    )
  }

  const rejectResult = data[0]

  if (!isRejectSubmissionRpcResponse(rejectResult)) {
    throw createRejectSubmissionError(
      'Supabase reject submission function did not return a valid result.'
    )
  }

  await cleanupRejectedSubmissionPhotos(
    rejectResult.submission_id,
    rejectedSubmissionStoragePaths
  )

  return {
    submissionId: rejectResult.submission_id
  }
}
