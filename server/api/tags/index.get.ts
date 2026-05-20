import { mockTags } from '../../../app/data/mockTags'
import { createFoundTagResponse } from '../../utils/tagResponse'

export default defineEventHandler(() => {
  return mockTags
    .filter((tag) => {
      return tag.status === 'found'
    })
    .map(createFoundTagResponse)
})