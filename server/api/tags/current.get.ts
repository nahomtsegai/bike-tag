import { createCurrentTagResponse } from '../../utils/tagResponse'
import { getCurrentTag } from '../../utils/tagStore'

export default defineEventHandler(() => {
  const activeTag = getCurrentTag()

  if (!activeTag) {
    throw createError({
      statusCode: 404,
      statusMessage: 'No active tag found.'
    })
  }

  return createCurrentTagResponse(activeTag)
})