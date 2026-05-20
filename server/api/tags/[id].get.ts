import {
  createCurrentTagResponse,
  createFoundTagResponse
} from '../../utils/tagResponse'
import { getTagById } from '../../utils/tagStore'

export default defineEventHandler((event) => {
  const tagId = getRouterParam(event, 'id')
  const tag = getTagById(tagId)

  if (!tag) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Tag not found.'
    })
  }

  if (tag.status === 'active') {
    return createCurrentTagResponse(tag)
  }

  return createFoundTagResponse(tag)
})