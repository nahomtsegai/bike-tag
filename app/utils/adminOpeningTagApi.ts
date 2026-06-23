import type { CurrentTagApiResponse } from '~/composables/useTagApi'
import { createAdminTagRequestBody } from './adminTagPhoto'

export type CreateAdminOpeningTagInput = {
  title: string
  clue: string
  imageUrl: string
  hiddenLocationMapUrl: string
  photoFile?: File | null
}

export type CreateAdminOpeningTagResponse = {
  success: boolean
  message: string
  currentTag: CurrentTagApiResponse
}

export const createAdminOpeningTag = async (
  input: CreateAdminOpeningTagInput
) => {
  return await $fetch<CreateAdminOpeningTagResponse>(
    '/api/admin/tags/opening',
    {
      method: 'POST',
      body: createAdminTagRequestBody(input)
    }
  )
}
