import {
  adminTagReplacementConfirmationText,
  isAdminTagReplacementConfirmed
} from '../../../../../shared/utils/adminTagReplacement'
import { runAdminAuditedAction } from '../../../../utils/adminAudit'
import { assertAdminRequestAccess } from '../../../../utils/adminAuth'
import {
  cleanupUploadedAdminTagPhoto,
  getAdminTagPhotoUrl,
  readAdminTagPhotoRequest
} from '../../../../utils/adminTagPhotoRequest'
import { replaceCurrentTagInSupabase } from '../../../../utils/supabaseReplaceCurrentTag'
import { getSupabaseTagById } from '../../../../utils/supabaseTags'
import { createCurrentTagResponse } from '../../../../utils/tagResponse'

const getRequiredString = ({
  value,
  fieldName,
  maxLength
}: {
  value: unknown
  fieldName: string
  maxLength?: number
}) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: `${fieldName} is required.`
    })
  }

  const normalizedValue = value.trim()

  if (maxLength && normalizedValue.length > maxLength) {
    throw createError({
      statusCode: 400,
      statusMessage: `${fieldName} must be ${maxLength} characters or fewer.`
    })
  }

  return normalizedValue
}

const assertValidUrl = ({
  value,
  fieldName
}: {
  value: string
  fieldName: string
}) => {
  try {
    const url = new URL(value)

    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new Error('Invalid protocol')
    }
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: `${fieldName} must be a valid URL.`
    })
  }
}

export default defineEventHandler(async (event) => {
  const { adminUser } = await assertAdminRequestAccess(event)
  const request = await readAdminTagPhotoRequest(event)
  let currentTagReplaced = false

  try {
    if (!isAdminTagReplacementConfirmed(request.body.confirmation)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Type ${adminTagReplacementConfirmationText} to confirm.`
      })
    }

    const title = getRequiredString({
      value: request.body.title,
      fieldName: 'Title',
      maxLength: 80
    })
    const clue = getRequiredString({
      value: request.body.clue,
      fieldName: 'Clue',
      maxLength: 500
    })
    const imageUrl = getRequiredString({
      value: getAdminTagPhotoUrl({
        imageUrl: request.body.imageUrl,
        uploadedPhoto: request.uploadedPhoto
      }),
      fieldName: 'Photo or photo URL'
    })
    const hiddenLocationMapUrl = getRequiredString({
      value: request.body.hiddenLocationMapUrl,
      fieldName: 'Hidden location map URL'
    })

    assertValidUrl({ value: imageUrl, fieldName: 'Photo URL' })
    assertValidUrl({
      value: hiddenLocationMapUrl,
      fieldName: 'Hidden location map URL'
    })

    const replacementResult = await runAdminAuditedAction({
      event,
      action: 'tag.current.replace',
      actor: adminUser,
      targetType: 'tag',
      metadata: {
        title,
        replacement: true,
        photoSource: request.uploadedPhoto ? 'upload' : 'url'
      },
      execute: () =>
        replaceCurrentTagInSupabase({
          title,
          clue,
          imageUrl,
          hiddenLocationMapUrl,
          reviewedBy: adminUser.email
        }),
      onSuccess: (result) => ({
        targetId: result.replacedTagId,
        metadata: {
          title,
          replacement: true,
          replacementTagId: result.currentTagId,
          supersededSubmissionCount: result.pendingSubmissionCount,
          photoSource: request.uploadedPhoto ? 'upload' : 'url'
        }
      })
    })

    currentTagReplaced = true

    const currentTag = await getSupabaseTagById(replacementResult.currentTagId)

    return {
      success: true,
      message:
        replacementResult.pendingSubmissionCount === 1
          ? 'Current tag replaced. 1 pending submission was superseded.'
          : `Current tag replaced. ${replacementResult.pendingSubmissionCount} pending submissions were superseded.`,
      replacedTagId: replacementResult.replacedTagId,
      supersededSubmissionCount: replacementResult.pendingSubmissionCount,
      currentTag: createCurrentTagResponse(currentTag)
    }
  } catch (error) {
    if (!currentTagReplaced) {
      await cleanupUploadedAdminTagPhoto(request.uploadedPhoto)
    }

    throw error
  }
})
