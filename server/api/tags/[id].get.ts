import {
  createCurrentTagResponse,
  createFoundTagResponse
} from '../../utils/tagResponse'
import { getTagByIdFromDataSource } from '../../utils/tagDataSource'

export default defineEventHandler(async (event) => {
  const tagId = getRouterParam(event, 'id')
  const tag = await getTagByIdFromDataSource(tagId)

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