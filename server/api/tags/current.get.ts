import { createCurrentTagResponse } from '../../utils/tagResponse'
import { getCurrentTagFromDataSource } from '../../utils/tagDataSource'

export default defineEventHandler(async () => {
  const activeTag = await getCurrentTagFromDataSource()

  return {
    currentTag: activeTag ? createCurrentTagResponse(activeTag) : null
  }
})