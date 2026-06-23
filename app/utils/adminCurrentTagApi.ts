import type { CurrentTagApiResponse } from '~/composables/useTagApi'
import { createAdminTagRequestBody } from './adminTagPhoto'

export type AdminCurrentTagStateResponse = {
  success: true
  currentTag: CurrentTagApiResponse | null
  pendingSubmissionCount: number
}

export type ReplaceAdminCurrentTagInput = {
  title: string
  clue: string
  imageUrl: string
  hiddenLocationMapUrl: string
  confirmation: string
  photoFile?: File | null
}

export type ReplaceAdminCurrentTagResponse = {
  success: true
  message: string
  replacedTagId: string
  supersededSubmissionCount: number
  currentTag: CurrentTagApiResponse
}

const getErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null) {
    if ('statusMessage' in error && typeof error.statusMessage === 'string') {
      return error.statusMessage
    }

    if (
      'data' in error &&
      typeof error.data === 'object' &&
      error.data !== null &&
      'statusMessage' in error.data &&
      typeof error.data.statusMessage === 'string'
    ) {
      return error.data.statusMessage
    }
  }

  return 'Could not update the current tag. Try again.'
}

export const getAdminCurrentTagState = async () => {
  try {
    return await $fetch<AdminCurrentTagStateResponse>('/api/admin/tags/current')
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const replaceAdminCurrentTag = async (input: ReplaceAdminCurrentTagInput) => {
  try {
    return await $fetch<ReplaceAdminCurrentTagResponse>(
      '/api/admin/tags/current/replace',
      {
        method: 'POST',
        body: createAdminTagRequestBody(input)
      }
    )
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}
