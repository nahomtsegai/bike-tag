import { mockTags } from '../../../app/data/mockTags'
import { createCurrentTagResponse } from '../../utils/tagResponse'

export default defineEventHandler(() => {
  const activeTag = mockTags.find((tag) => {
    return tag.status === 'active'
  })

  if (!activeTag) {
    throw createError({
      statusCode: 404,
      statusMessage: 'No active tag found.'
    })
  }

  return createCurrentTagResponse(activeTag)
})