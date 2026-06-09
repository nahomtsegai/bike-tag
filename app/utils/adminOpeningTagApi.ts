import type { CurrentTagApiResponse } from '~/composables/useTagApi'
import { getAdminAuthHeaders } from './adminTokenStorage'

export type CreateAdminOpeningTagInput = {
  title: string
  clue: string
  imageUrl: string
  hiddenLocationMapUrl: string
}

export type CreateAdminOpeningTagResponse = {
  success: boolean
  message: string
  currentTag: CurrentTagApiResponse
}

export const createAdminOpeningTag = async ({
  title,
  clue,
  imageUrl,
  hiddenLocationMapUrl
}: CreateAdminOpeningTagInput) => {
  return await $fetch<CreateAdminOpeningTagResponse>(
    '/api/admin/tags/opening',
    {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      body: {
        title,
        clue,
        imageUrl,
        hiddenLocationMapUrl
      }
    }
  )
}