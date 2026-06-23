import {
  adminTagReplacementConfirmationText,
  isAdminTagReplacementConfirmed
} from '../../../../../shared/utils/adminTagReplacement'
import { runAdminAuditedAction } from '../../../../utils/adminAudit'
import { assertAdminRequestAccess } from '../../../../utils/adminAuth'
import { replaceCurrentTagInSupabase } from '../../../../utils/supabaseReplaceCurrentTag'
import { getSupabaseTagById } from '../../../../utils/supabaseTags'
import { createCurrentTagResponse } from '../../../../utils/tagResponse'

type ReplaceCurrentTagRequestBody = {
  title?: string
  clue?: string
  imageUrl?: string
  hiddenLocationMapUrl?: string
  confirmation?: string
}

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
  const body = await readBody<ReplaceCurrentTagRequestBody>(event)

  if (!isAdminTagReplacementConfirmed(body.confirmation)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Type ${adminTagReplacementConfirmationText} to confirm.`
    })
  }

  const title = getRequiredString({
    value: body.title,
    fieldName: 'Title',
    maxLength: 80
  })
  const clue = getRequiredString({
    value: body.clue,
    fieldName: 'Clue',
    maxLength: 500
  })
  const imageUrl = getRequiredString({
    value: body.imageUrl,
    fieldName: 'Photo URL'
  })
  const hiddenLocationMapUrl = getRequiredString({
    value: body.hiddenLocationMapUrl,
    fieldName: 'Hidden location map URL'
  })

  assertValidUrl({ value: imageUrl, fieldName: 'Photo URL' })
  assertValidUrl({
    value: hiddenLocationMapUrl,
    fieldName: 'Hidden location map URL'
  })

  const replacementResult = await runAdminAuditedAction({
    event,
    action: 'tag.opening.create',
    actor: adminUser,
    targetType: 'tag',
    metadata: {
      title,
      replacement: true
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
        supersededSubmissionCount: result.pendingSubmissionCount
      }
    })
  })

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
})
