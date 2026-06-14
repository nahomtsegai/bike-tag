import { createSupabaseServerClient } from './supabase'
import {
  deleteBikeTagPhotos,
  deletePendingBikeTagPhotos,
  promotePendingBikeTagPhoto
} from './supabaseStorage'

type ApproveSubmissionInput = {
  submissionId: string
  reviewedBy: string
}

type ApproveSubmissionRpcResponse = {
  submission_id: string
  found_tag_id: string
  current_tag_id: string
}

type ApproveSubmissionRpcError = {
  message: string
  code?: string | null
  details?: string | null
  hint?: string | null
}

type SubmissionPhotoReferences = {
  id: string
  status: string
  match_photo_url: string | null
  match_photo_storage_path: string | null
  next_tag_photo_url: string | null
  next_tag_photo_storage_path: string | null
}

type ApprovalPhotoReference = {
  publicUrl: string
  publicStoragePath: string | null
  pendingStoragePath: string | null
}

const approveSubmissionErrorMap = {
  SUBMISSION_ID_REQUIRED: {
    statusCode: 400,
    statusMessage: 'Submission id is required.'
  },
  REVIEWER_REQUIRED: {
    statusCode: 400,
    statusMessage: 'Reviewer is required.'
  },
  MATCH_PHOTO_URL_REQUIRED: {
    statusCode: 500,
    statusMessage: 'Matching photo could not be published.'
  },
  NEXT_TAG_PHOTO_URL_REQUIRED: {
    statusCode: 500,
    statusMessage: 'Next tag photo could not be published.'
  },
  SUBMISSION_NOT_FOUND: {
    statusCode: 404,
    statusMessage: 'Submission was not found.'
  },
  SUBMISSION_NOT_PENDING: {
    statusCode: 409,
    statusMessage: 'Submission has already been reviewed.'
  },
  ACTIVE_TAG_NOT_ACTIVE: {
    statusCode: 409,
    statusMessage: 'Related active tag is no longer active.'
  },
  ACTIVE_TAG_UPDATE_FAILED: {
    statusCode: 409,
    statusMessage: 'Could not mark active tag as found.'
  }
} as const

const createApproveSubmissionError = (message: string) => {
  return createError({
    statusCode: 500,
    statusMessage: message
  })
}

const getErrorSearchText = (error: ApproveSubmissionRpcError) => {
  return [error.message, error.details, error.hint]
    .filter((value): value is string => {
      return typeof value === 'string'
    })
    .join(' ')
}

const isUniqueConstraintViolation = (
  error: ApproveSubmissionRpcError,
  constraintName: string
) => {
  return error.code === '23505' && getErrorSearchText(error).includes(
    constraintName
  )
}

const createMappedApproveSubmissionError = (
  error: ApproveSubmissionRpcError
) => {
  if (
    isUniqueConstraintViolation(
      error,
      'one_approved_submission_per_active_tag'
    )
  ) {
    return createError({
      statusCode: 409,
      statusMessage: 'This tag already has an approved submission.'
    })
  }

  if (isUniqueConstraintViolation(error, 'one_active_tag')) {
    return createError({
      statusCode: 409,
      statusMessage: 'Another active tag already exists.'
    })
  }

  const mappedError =
    approveSubmissionErrorMap[
      error.message as keyof typeof approveSubmissionErrorMap
    ]

  if (!mappedError) {
    return createApproveSubmissionError(
      `Could not approve submission in Supabase: ${error.message}`
    )
  }

  return createError(mappedError)
}

const isApproveSubmissionRpcResponse = (
  value: unknown
): value is ApproveSubmissionRpcResponse => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'submission_id' in value &&
    typeof value.submission_id === 'string' &&
    'found_tag_id' in value &&
    typeof value.found_tag_id === 'string' &&
    'current_tag_id' in value &&
    typeof value.current_tag_id === 'string'
  )
}

const isSubmissionPhotoReferences = (
  value: unknown
): value is SubmissionPhotoReferences => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'status' in value &&
    typeof value.status === 'string' &&
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

const loadSubmissionPhotoReferences = async (submissionId: string) => {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from('submissions')
    .select(
      [
        'id',
        'status',
        'match_photo_url',
        'match_photo_storage_path',
        'next_tag_photo_url',
        'next_tag_photo_storage_path'
      ].join(',')
    )
    .eq('id', submissionId)
    .maybeSingle()

  if (error) {
    throw createApproveSubmissionError(
      `Could not load submission photos before approval: ${error.message}`
    )
  }

  if (!data) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Submission was not found.'
    })
  }

  if (!isSubmissionPhotoReferences(data)) {
    throw createApproveSubmissionError(
      'Submission photos returned an unexpected response.'
    )
  }

  if (data.status !== 'pending') {
    throw createError({
      statusCode: 409,
      statusMessage: 'Submission has already been reviewed.'
    })
  }

  return data
}

const publishApprovalPhoto = async ({
  submissionId,
  publicUrl,
  pendingStoragePath,
  photoType
}: {
  submissionId: string
  publicUrl: string | null
  pendingStoragePath: string | null
  photoType: 'match_photo' | 'tag_photo'
}): Promise<ApprovalPhotoReference> => {
  const normalizedPendingStoragePath = pendingStoragePath?.trim() ?? ''

  if (normalizedPendingStoragePath) {
    const promotedPhoto = await promotePendingBikeTagPhoto({
      storagePath: normalizedPendingStoragePath,
      submissionId,
      photoType
    })

    return {
      publicUrl: promotedPhoto.publicUrl,
      publicStoragePath: promotedPhoto.storagePath,
      pendingStoragePath: normalizedPendingStoragePath
    }
  }

  const normalizedPublicUrl = publicUrl?.trim() ?? ''

  if (!normalizedPublicUrl) {
    throw createApproveSubmissionError(
      'Submission does not contain a usable photo reference.'
    )
  }

  return {
    publicUrl: normalizedPublicUrl,
    publicStoragePath: null,
    pendingStoragePath: null
  }
}

const cleanupFailedPublicPromotions = async (
  submissionId: string,
  storagePaths: string[]
) => {
  if (!storagePaths.length) {
    return
  }

  try {
    await deleteBikeTagPhotos(storagePaths)
  } catch (error) {
    console.error('Could not roll back published submission photos.', {
      submissionId,
      storagePaths,
      error
    })
  }
}

const cleanupApprovedPendingPhotos = async (
  submissionId: string,
  storagePaths: string[]
) => {
  if (!storagePaths.length) {
    return
  }

  try {
    await deletePendingBikeTagPhotos(storagePaths)
  } catch (error) {
    console.error('Could not delete approved private submission photos.', {
      submissionId,
      storagePaths,
      error
    })
  }
}

export const approveSubmissionInSupabase = async ({
  submissionId,
  reviewedBy
}: ApproveSubmissionInput) => {
  const submission = await loadSubmissionPhotoReferences(submissionId)
  const promotedPublicStoragePaths: string[] = []
  const pendingStoragePaths: string[] = []

  try {
    const matchPhoto = await publishApprovalPhoto({
      submissionId,
      publicUrl: submission.match_photo_url,
      pendingStoragePath: submission.match_photo_storage_path,
      photoType: 'match_photo'
    })

    if (matchPhoto.publicStoragePath) {
      promotedPublicStoragePaths.push(matchPhoto.publicStoragePath)
    }

    if (matchPhoto.pendingStoragePath) {
      pendingStoragePaths.push(matchPhoto.pendingStoragePath)
    }

    const nextTagPhoto = await publishApprovalPhoto({
      submissionId,
      publicUrl: submission.next_tag_photo_url,
      pendingStoragePath: submission.next_tag_photo_storage_path,
      photoType: 'tag_photo'
    })

    if (nextTagPhoto.publicStoragePath) {
      promotedPublicStoragePaths.push(nextTagPhoto.publicStoragePath)
    }

    if (nextTagPhoto.pendingStoragePath) {
      pendingStoragePaths.push(nextTagPhoto.pendingStoragePath)
    }

    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase.rpc(
      'approve_submission_with_public_photos',
      {
        p_submission_id: submissionId,
        p_reviewed_by: reviewedBy,
        p_match_photo_url: matchPhoto.publicUrl,
        p_next_tag_photo_url: nextTagPhoto.publicUrl
      }
    )

    if (error) {
      throw createMappedApproveSubmissionError(error)
    }

    if (!Array.isArray(data)) {
      throw createApproveSubmissionError(
        'Supabase approve submission function returned an unexpected response.'
      )
    }

    const approveResult = data[0]

    if (!isApproveSubmissionRpcResponse(approveResult)) {
      throw createApproveSubmissionError(
        'Supabase approve submission function did not return a valid result.'
      )
    }

    await cleanupApprovedPendingPhotos(
      approveResult.submission_id,
      pendingStoragePaths
    )

    return {
      submissionId: approveResult.submission_id,
      foundTagId: approveResult.found_tag_id,
      currentTagId: approveResult.current_tag_id
    }
  } catch (error) {
    await cleanupFailedPublicPromotions(
      submissionId,
      promotedPublicStoragePaths
    )

    throw error
  }
}
