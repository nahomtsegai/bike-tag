import { expectedActiveTagIdHeaderName } from '~~/shared/utils/submitActiveTag'

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
  hiddenLocationMapUrl?: string
  foundBy: string
  createdAt: string
  createdAtIso: string
  status: 'active' | 'found'
  foundLatitude?: number
  foundLongitude?: number
  foundLocationAccuracyMeters?: number
  foundLocationCapturedAt?: string
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

type SubmitTagClientError = Error & {
  statusCode: number
  statusMessage: string
}

const createMissingExpectedActiveTagError = (): SubmitTagClientError => {
  const statusMessage =
    'The current Bike Tag could not be confirmed. Refresh the page before submitting.'
  const error = new Error(statusMessage) as SubmitTagClientError

  error.statusCode = 409
  error.statusMessage = statusMessage

  return error
}

export const useTagApi = () => {
  const submitCurrentTagData = useNuxtData<CurrentTagApiPayload>(
    'submit-current-tag'
  )

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
    const expectedActiveTagId =
      submitCurrentTagData.data.value?.currentTag?.id?.trim()

    if (!expectedActiveTagId) {
      throw createMissingExpectedActiveTagError()
    }

    input.set('expectedActiveTagId', expectedActiveTagId)

    return await $fetch<SubmitTagApiResponse>('/api/tags/submit', {
      method: 'POST',
      body: input,
      headers: {
        [expectedActiveTagIdHeaderName]: expectedActiveTagId
      }
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
