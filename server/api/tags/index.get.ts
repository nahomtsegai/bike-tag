import { createFoundTagResponse } from '../../utils/tagResponse'
import { getFoundTags } from '../../utils/tagStore'

export default defineEventHandler(() => {
  return getFoundTags().map(createFoundTagResponse)
})