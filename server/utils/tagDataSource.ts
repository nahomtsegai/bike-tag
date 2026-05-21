import type { BikeTag } from '../../app/data/mockTags'
import {
  getCurrentTag,
  getFoundTags,
  getTagById
} from './tagStore'
import {
  getSupabaseCurrentTag,
  getSupabaseFoundTags,
  getSupabaseTagById
} from './supabaseTags'

type TagDataSource = 'mock' | 'supabase'

const isTagDataSource = (value: unknown): value is TagDataSource => {
  return value === 'mock' || value === 'supabase'
}

const getTagDataSource = (): TagDataSource => {
  const runtimeConfig = useRuntimeConfig()
  const configuredDataSource = runtimeConfig.tagDataSource

  if (isTagDataSource(configuredDataSource)) {
    return configuredDataSource
  }

  return 'mock'
}

export const getCurrentTagFromDataSource = async (): Promise<
  BikeTag | undefined
> => {
  if (getTagDataSource() === 'supabase') {
    return await getSupabaseCurrentTag()
  }

  return getCurrentTag()
}

export const getFoundTagsFromDataSource = async (): Promise<BikeTag[]> => {
  if (getTagDataSource() === 'supabase') {
    return await getSupabaseFoundTags()
  }

  return getFoundTags()
}

export const getTagByIdFromDataSource = async (
  tagId?: string
): Promise<BikeTag | undefined> => {
  if (getTagDataSource() === 'supabase') {
    return await getSupabaseTagById(tagId)
  }

  return getTagById(tagId)
}