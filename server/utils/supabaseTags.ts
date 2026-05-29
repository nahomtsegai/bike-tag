import type { BikeTag } from '../../app/data/mockTags'

import { createSupabaseServerClient } from './supabase'

type SupabaseTagRow = {
  id: string
  title: string
  clue: string
  tag_photo_url: string
  match_photo_url: string | null
  location_map_url: string | null
  hidden_location_map_url: string | null
  found_by: string
  status: 'active' | 'found'
  created_at: string
  found_at: string | null
}

const tagSelectColumns = [
  'id',
  'title',
  'clue',
  'tag_photo_url',
  'match_photo_url',
  'location_map_url',
  'hidden_location_map_url',
  'found_by',
  'status',
  'created_at',
  'found_at'
].join(', ')

const formatDisplayDate = (createdAtIso: string) => {
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(createdAtIso))
}

const mapSupabaseTagToBikeTag = (tag: SupabaseTagRow): BikeTag => {
  return {
    id: tag.id,
    title: tag.title,
    clue: tag.clue,
    imageUrl: tag.tag_photo_url,
    locationMapUrl: tag.location_map_url ?? undefined,
    hiddenLocationMapUrl: tag.hidden_location_map_url ?? undefined,
    foundBy: tag.found_by,
    createdAt: formatDisplayDate(tag.created_at),
    createdAtIso: tag.created_at,
    status: tag.status
  }
}

const createSupabaseReadError = (message: string) => {
  return createError({
    statusCode: 500,
    statusMessage: message
  })
}

const createSupabaseNotFoundError = (message: string) => {
  return createError({
    statusCode: 404,
    statusMessage: message
  })
}

export const getSupabaseCurrentTag = async () => {
  const supabase = createSupabaseServerClient()

const { data, error } = await supabase
  .from('tags')
  .select(tagSelectColumns)
  .eq('status', 'active')
  .maybeSingle()
  .overrideTypes<SupabaseTagRow, { merge: false }>()

  if (error) {
    throw createSupabaseReadError(
      `Could not load current tag from Supabase: ${error.message}`
    )
  }

  if (!data) {
    return undefined
  }

  return mapSupabaseTagToBikeTag(data)
}

export const getSupabaseFoundTags = async () => {
  const supabase = createSupabaseServerClient()

  const { data, error } = await supabase
    .from('tags')
    .select(tagSelectColumns)
    .eq('status', 'found')
    .order('found_at', { ascending: false })
    .returns<SupabaseTagRow[]>()

  if (error) {
    throw createSupabaseReadError(
      `Could not load found tags from Supabase: ${error.message}`
    )
  }

  return data.map(mapSupabaseTagToBikeTag)
}

export const getSupabaseTagById = async (tagId?: string) => {
  if (!tagId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tag id is required.'
    })
  }

  const supabase = createSupabaseServerClient()

  const { data, error } = await supabase
    .from('tags')
    .select(tagSelectColumns)
    .eq('id', tagId)
    .maybeSingle()
    .overrideTypes<SupabaseTagRow, { merge: false }>()

  if (error) {
    throw createSupabaseReadError(
      `Could not load tag from Supabase: ${error.message}`
    )
  }

  if (!data) {
    throw createSupabaseNotFoundError('Tag not found in Supabase.')
  }

  return mapSupabaseTagToBikeTag(data)
}