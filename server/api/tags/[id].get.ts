import { mockTags } from '../../../app/data/mockTags'
import {
  createCurrentTagResponse,
  createFoundTagResponse
} from '../../utils/tagResponse'

export default defineEventHandler((event) => {
  const tagId = getRouterParam(event, 'id')

  const tag = mockTags.find((bikeTag) => {
    return bikeTag.id === tagId
  })

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