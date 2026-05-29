export type CurrentTagApiResponse = {
  id: string
  title: string
  imageUrl: string
  foundBy: string
  createdAt: string
  createdAtIso: string
  status: 'active' | 'found'
  clue?: string
  clueIsUnlocked: boolean
  clueUnlocksAtIso: string
}

export type CurrentTagApiPayload = {
  currentTag: CurrentTagApiResponse | null
}

export type FoundTagApiResponse = {
  id: string
  title: string
  clue: string
  imageUrl: string
  locationMapUrl?: string
  foundBy: string
  createdAt: string
  createdAtIso: string
  status: 'found'
}

export type TagDetailApiResponse =
  | CurrentTagApiResponse
  | FoundTagApiResponse

export type SubmitTagApiInput = FormData

export type SubmitTagApiResponse = {
  success: boolean
  message: string
  currentTag: CurrentTagApiResponse
  foundTagId?: string
  submissionId?: string
  status?: 'pending'
}

export type ResetTagsApiResponse = {
  success: boolean
  message: string
  currentTag: CurrentTagApiResponse
  foundTags: FoundTagApiResponse[]
}

export const useTagApi = () => {
  const fetchCurrentTag = async () => {
    return await $fetch<CurrentTagApiPayload>('/api/tags/current')
  }

  const fetchFoundTags = async () => {
    return await $fetch<FoundTagApiResponse[]>('/api/tags')
  }

  const fetchTagById = async (tagId: string) => {
    return await $fetch<TagDetailApiResponse>(`/api/tags/${tagId}`)
  }

  const submitTag = async (input: SubmitTagApiInput) => {
    return await $fetch<SubmitTagApiResponse>('/api/tags/submit', {
      method: 'POST',
      body: input
    })
  }

  const resetTags = async () => {
    return await $fetch<ResetTagsApiResponse>('/api/tags/reset', {
      method: 'POST'
    })
  }

  return {
    fetchCurrentTag,
    fetchFoundTags,
    fetchTagById,
    submitTag,
    resetTags
  }
}