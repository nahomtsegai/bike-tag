import {
  createCurrentTagResponse,
  createFoundTagResponse
} from '../../utils/tagResponse'
import { resetTagStore } from '../../utils/tagStore'

export default defineEventHandler(() => {
  const resetResult = resetTagStore()

  if (!resetResult.currentTag) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Mock tag store reset did not create an active tag.'
    })
  }

  return {
    success: true,
    message: 'Mock game data was reset.',
    currentTag: createCurrentTagResponse(resetResult.currentTag),
    foundTags: resetResult.foundTags.map(createFoundTagResponse)
  }
})