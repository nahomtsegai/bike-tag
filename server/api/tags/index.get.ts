import { createFoundTagResponse } from '../../utils/tagResponse'
import { getFoundTagsFromDataSource } from '../../utils/tagDataSource'

export default defineEventHandler(async () => {
  const foundTags = await getFoundTagsFromDataSource()

  return foundTags.map(createFoundTagResponse)
})