import { createCurrentTagResponse } from '../../utils/tagResponse'
import { getCurrentTagFromDataSource } from '../../utils/tagDataSource'

export default defineEventHandler(async () => {
  const activeTag = await getCurrentTagFromDataSource()

  if (!activeTag) {
    throw createError({
      statusCode: 404,
      statusMessage: 'No active tag found.'
    })
  }

  return createCurrentTagResponse(activeTag)
})