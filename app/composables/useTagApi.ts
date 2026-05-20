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

export const useTagApi = () => {
  const fetchCurrentTag = async () => {
    return await $fetch<CurrentTagApiResponse>('/api/tags/current')
  }

  const fetchFoundTags = async () => {
    return await $fetch<FoundTagApiResponse[]>('/api/tags')
  }

  const fetchTagById = async (tagId: string) => {
    return await $fetch<TagDetailApiResponse>(`/api/tags/${tagId}`)
  }

  return {
    fetchCurrentTag,
    fetchFoundTags,
    fetchTagById
  }
}