import { runAdminAuditedAction } from '../../../utils/adminAudit'
import { assertAdminRequestAccess } from '../../../utils/adminAuth'
import {
  createSupabaseOpeningTag,
  getSupabaseCurrentTag
} from '../../../utils/supabaseTags'
import { createCurrentTagResponse } from '../../../utils/tagResponse'

type CreateOpeningTagRequestBody = {
  title?: string
  clue?: string
  imageUrl?: string
  hiddenLocationMapUrl?: string
}

const getRequiredString = ({
  value,
  fieldName
}: {
  value: unknown
  fieldName: string
}) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: `${fieldName} is required.`
    })
  }

  return value.trim()
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

  const currentTag = await getSupabaseCurrentTag()

  if (currentTag) {
    throw createError({
      statusCode: 409,
      statusMessage: 'An active Bike Tag already exists.'
    })
  }

  const body = await readBody<CreateOpeningTagRequestBody>(event)

  const title = getRequiredString({
    value: body.title,
    fieldName: 'Title'
  })

  const clue = getRequiredString({
    value: body.clue,
    fieldName: 'Clue'
  })

  const imageUrl = getRequiredString({
    value: body.imageUrl,
    fieldName: 'Photo URL'
  })

  const hiddenLocationMapUrl = getRequiredString({
    value: body.hiddenLocationMapUrl,
    fieldName: 'Hidden location map URL'
  })

  assertValidUrl({
    value: imageUrl,
    fieldName: 'Photo URL'
  })

  assertValidUrl({
    value: hiddenLocationMapUrl,
    fieldName: 'Hidden location map URL'
  })

  const openingTag = await runAdminAuditedAction({
    event,
    action: 'tag.opening.create',
    actor: adminUser,
    targetType: 'tag',
    metadata: {
      title
    },
    execute: () =>
      createSupabaseOpeningTag({
        title,
        clue,
        imageUrl,
        hiddenLocationMapUrl
      }),
    onSuccess: (createdTag) => ({
      targetId: createdTag.id
    })
  })

  return {
    success: true,
    message: 'Opening tag created.',
    currentTag: createCurrentTagResponse(openingTag)
  }
})
