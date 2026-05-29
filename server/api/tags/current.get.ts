import { createCurrentTagResponse } from '../../utils/tagResponse'
import { getCurrentTagFromDataSource } from '../../utils/tagDataSource'

export default defineEventHandler(async () => {
  const activeTag = await getCurrentTagFromDataSource()

  if (!activeTag) {
    return null
  }

  return createCurrentTagResponse(activeTag)
})