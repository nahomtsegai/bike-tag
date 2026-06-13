import type { CurrentTagApiResponse } from '~/composables/useTagApi'

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
      body: {
        title,
        clue,
        imageUrl,
        hiddenLocationMapUrl
      }
    }
  )
}