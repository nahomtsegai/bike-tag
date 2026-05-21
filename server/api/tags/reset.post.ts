import { getTagDataSource } from '../../utils/tagDataSource'
import { resetTagStore } from '../../utils/tagStore'
import {
  createCurrentTagResponse,
  createFoundTagResponse
} from '../../utils/tagResponse'

const isDevelopmentEnvironment = () => {
  return import.meta.dev
}

const assertResetIsAllowed = () => {
  if (!isDevelopmentEnvironment()) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Reset is only available in development.'
    })
  }

  if (getTagDataSource() !== 'mock') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Reset is only available when using the mock data source.'
    })
  }
}

export default defineEventHandler(() => {
  assertResetIsAllowed()

  const resetResult = resetTagStore()

  if (!resetResult.currentTag) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Mock game data reset did not create an active tag.'
    })
  }

  return {
    success: true,
    message: 'Mock game data was reset.',
    currentTag: createCurrentTagResponse(resetResult.currentTag),
    foundTags: resetResult.foundTags.map(createFoundTagResponse)
  }
})