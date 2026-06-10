import type { BikeTag } from '../../app/data/mockTags'
import { getCurrentTag, getFoundTags, getTagById } from './tagStore'
import {
  getSupabaseCurrentTag,
  getSupabaseFoundTags,
  getSupabaseTagById
} from './supabaseTags'

export type TagDataSource = 'mock' | 'supabase'

type ResolveTagDataSourceOptions = {
  allowMockDataSource: boolean
}

export const isTagDataSource = (value: unknown): value is TagDataSource => {
  return value === 'mock' || value === 'supabase'
}

const isMissingTagDataSource = (value: unknown) => {
  return value === undefined || value === null || value === ''
}

const createTagDataSourceConfigurationError = () => {
  return createError({
    statusCode: 500,
    statusMessage:
      'Tag data source must be configured as "supabase" outside development.'
  })
}

const canUseMockDataSource = () => {
  return import.meta.dev || import.meta.test
}

export const resolveTagDataSource = (
  configuredDataSource: unknown,
  { allowMockDataSource }: ResolveTagDataSourceOptions
): TagDataSource => {
  if (configuredDataSource === 'supabase') {
    return 'supabase'
  }

  if (configuredDataSource === 'mock') {
    if (allowMockDataSource) {
      return 'mock'
    }

    throw createTagDataSourceConfigurationError()
  }

  if (isMissingTagDataSource(configuredDataSource) && allowMockDataSource) {
    return 'mock'
  }

  throw createTagDataSourceConfigurationError()
}

export const getTagDataSource = (): TagDataSource => {
  const runtimeConfig = useRuntimeConfig()

  return resolveTagDataSource(runtimeConfig.tagDataSource, {
    allowMockDataSource: canUseMockDataSource()
  })
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