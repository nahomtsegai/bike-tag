import {
  deleteBikeTagPhotos,
  deletePendingBikeTagPhotos,
  getStoragePathFromPublicUrl
} from './supabaseStorage'
import { createSupabaseServerClient } from './supabase'
import { getSupabaseCurrentTag } from './supabaseTags'

export type ReplaceCurrentTagInput = {
  title: string
  clue: string
  imageUrl: string
  hiddenLocationMapUrl: string
  reviewedBy: string
}

type ReplaceCurrentTagRpcResponse = {
  replaced_tag_id: string
  current_tag_id: string
  pending_submission_count: number
  superseded_submissions?: unknown
}

type SupersededSubmissionPhotoReferences = {
  submission_id: string
  match_photo_url: string | null
  match_photo_storage_path: string | null
  next_tag_photo_url: string | null
  next_tag_photo_storage_path: string | null
}

type SupabaseRpcError = {
  message: string
  code?: string | null
  details?: string | null
  hint?: string | null
}

const replacementErrorMap = {
  TITLE_REQUIRED: {
    statusCode: 400,
    statusMessage: 'Title is required.'
  },
  TITLE_TOO_LONG: {
    statusCode: 400,
    statusMessage: 'Title must be 80 characters or fewer.'
  },
  CLUE_REQUIRED: {
    statusCode: 400,
    statusMessage: 'Clue is required.'
  },
  CLUE_TOO_LONG: {
    statusCode: 400,
    statusMessage: 'Clue must be 500 characters or fewer.'
  },
  TAG_PHOTO_URL_REQUIRED: {
    statusCode: 400,
    statusMessage: 'Photo URL is required.'
  },
  HIDDEN_LOCATION_URL_REQUIRED: {
    statusCode: 400,
    statusMessage: 'Hidden location map URL is required.'
  },
  REVIEWER_REQUIRED: {
    statusCode: 400,
    statusMessage: 'Admin reviewer is required.'
  },
  ACTIVE_TAG_NOT_FOUND: {
    statusCode: 409,
    statusMessage: 'There is no active Bike Tag to replace.'
  },
  ACTIVE_TAG_UPDATE_FAILED: {
    statusCode: 409,
    statusMessage: 'The active Bike Tag changed before it could be replaced.'
  }
} as const

const createReplacementError = (message: string) => {
  return createError({
    statusCode: 500,
    statusMessage: message
  })
}

const getRpcErrorSearchText = (error: SupabaseRpcError) => {
  return [error.message, error.details, error.hint]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
}

const createMappedReplacementError = (error: SupabaseRpcError) => {
  if (
    error.code === '23505' &&
    getRpcErrorSearchText(error).includes('one_active_tag')
  ) {
    return createError({
      statusCode: 409,
      statusMessage: 'Another active Bike Tag already exists.'
    })
  }

  const mappedError =
    replacementErrorMap[
      error.message as keyof typeof replacementErrorMap
    ]

  if (mappedError) {
    return createError(mappedError)
  }

  return createReplacementError(
    `Could not replace current tag in Supabase: ${error.message}`
  )
}

const isReplaceCurrentTagRpcResponse = (
  value: unknown
): value is ReplaceCurrentTagRpcResponse => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'replaced_tag_id' in value &&
    typeof value.replaced_tag_id === 'string' &&
    'current_tag_id' in value &&
    typeof value.current_tag_id === 'string' &&
    'pending_submission_count' in value &&
    typeof value.pending_submission_count === 'number'
  )
}

const isSupersededSubmissionPhotoReferences = (
  value: unknown
): value is SupersededSubmissionPhotoReferences => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'submission_id' in value &&
    typeof value.submission_id === 'string' &&
    'match_photo_url' in value &&
    (typeof value.match_photo_url === 'string' || value.match_photo_url === null) &&
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

const getSupersededSubmissionPhotoReferences = (value: unknown) => {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(isSupersededSubmissionPhotoReferences)
}

const cleanupSupersededSubmissionPhotos = async (
  submissions: SupersededSubmissionPhotoReferences[]
) => {
  const submissionIds = submissions.map((submission) => submission.submission_id)
  const privateStoragePaths = submissions.flatMap((submission) => {
    return [
      submission.match_photo_storage_path,
      submission.next_tag_photo_storage_path
    ].filter((value): value is string => {
      return typeof value === 'string' && Boolean(value.trim())
    })
  })
  const publicStoragePaths = submissions.flatMap((submission) => {
    return [submission.match_photo_url, submission.next_tag_photo_url]
      .map((value) => (value ? getStoragePathFromPublicUrl(value) : ''))
      .filter((value): value is string => Boolean(value))
  })

  if (privateStoragePaths.length) {
    try {
      await deletePendingBikeTagPhotos(privateStoragePaths)
    } catch (error) {
      console.error('Could not delete replaced-tag private submission photos.', {
        submissionIds,
        storagePaths: privateStoragePaths,
        error
      })
    }
  }

  if (publicStoragePaths.length) {
    try {
      await deleteBikeTagPhotos(publicStoragePaths)
    } catch (error) {
      console.error('Could not delete replaced-tag public submission photos.', {
        submissionIds,
        storagePaths: publicStoragePaths,
        error
      })
    }
  }
}

export const getAdminCurrentTagState = async () => {
  const currentTag = await getSupabaseCurrentTag()

  if (!currentTag) {
    return {
      currentTag: null,
      pendingSubmissionCount: 0
    }
  }

  const supabase = createSupabaseServerClient()
  const { count, error } = await supabase
    .from('submissions')
    .select('id', {
      count: 'exact',
      head: true
    })
    .eq('active_tag_id', currentTag.id)
    .eq('status', 'pending')

  if (error) {
    throw createReplacementError(
      `Could not count pending submissions for current tag: ${error.message}`
    )
  }

  return {
    currentTag,
    pendingSubmissionCount: count ?? 0
  }
}

export const replaceCurrentTagInSupabase = async ({
  title,
  clue,
  imageUrl,
  hiddenLocationMapUrl,
  reviewedBy
}: ReplaceCurrentTagInput) => {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase.rpc('replace_active_tag', {
    p_title: title,
    p_clue: clue,
    p_tag_photo_url: imageUrl,
    p_hidden_location_map_url: hiddenLocationMapUrl,
    p_reviewed_by: reviewedBy
  })

  if (error) {
    throw createMappedReplacementError(error)
  }

  if (!Array.isArray(data)) {
    throw createReplacementError(
      'Supabase replace active tag function returned an unexpected response.'
    )
  }

  const replacementResult = data[0]

  if (!isReplaceCurrentTagRpcResponse(replacementResult)) {
    throw createReplacementError(
      'Supabase replace active tag function did not return a valid result.'
    )
  }

  const supersededSubmissions = getSupersededSubmissionPhotoReferences(
    replacementResult.superseded_submissions
  )

  await cleanupSupersededSubmissionPhotos(supersededSubmissions)

  return {
    replacedTagId: replacementResult.replaced_tag_id,
    currentTagId: replacementResult.current_tag_id,
    pendingSubmissionCount: replacementResult.pending_submission_count
  }
}
