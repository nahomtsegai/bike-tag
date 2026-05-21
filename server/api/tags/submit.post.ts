import {
  isAllowedImageMimeType,
  isAllowedImageSize
} from '../../../shared/utils/imageValidation'
import { isValidGoogleMapsUrl } from '../../../shared/utils/mapValidation'
import { createCurrentTagResponse } from '../../utils/tagResponse'
import { submitTagToStore } from '../../utils/tagStore'
import { getTagDataSource } from '../../utils/tagDataSource'

type SubmitTagRequestBody = {
  riderName?: string
  foundLocationMapUrl?: string
  nextTitle?: string
  nextClue?: string
  nextHiddenLocationMapUrl?: string
  matchPhoto?: {
    name?: string
    type?: string
    size?: number
  }
  nextPhoto?: {
    name?: string
    type?: string
    size?: number
  }
}

const maxRiderNameLength = 50
const maxTitleLength = 80
const maxClueLength = 500

const createValidationError = (message: string) => {
  return createError({
    statusCode: 400,
    statusMessage: message
  })
}

const validateRequiredText = (
  value: unknown,
  fieldName: string,
  maxLength: number
) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw createValidationError(`${fieldName} is required.`)
  }

  const trimmedValue = value.trim()

  if (trimmedValue.length > maxLength) {
    throw createValidationError(`${fieldName} is too long.`)
  }

  return trimmedValue
}

const validateMapUrl = (value: unknown, fieldName: string) => {
  const mapUrl = validateRequiredText(value, fieldName, 2048)

  if (!isValidGoogleMapsUrl(mapUrl)) {
    throw createValidationError(`${fieldName} must be a valid Google Maps link.`)
  }

  return mapUrl
}

const validateImageMetadata = (
  imageMetadata: SubmitTagRequestBody['matchPhoto'],
  fieldName: string
) => {
  if (!imageMetadata) {
    throw createValidationError(`${fieldName} is required.`)
  }

  if (
    typeof imageMetadata.name !== 'string' ||
    typeof imageMetadata.type !== 'string' ||
    typeof imageMetadata.size !== 'number'
  ) {
    throw createValidationError(`${fieldName} metadata is invalid.`)
  }

  if (!isAllowedImageMimeType(imageMetadata.type)) {
    throw createValidationError(`${fieldName} must be a jpg, png, or webp image.`)
  }

  if (!isAllowedImageSize(imageMetadata.size)) {
    throw createValidationError(`${fieldName} must be smaller than 8 MB.`)
  }

  return imageMetadata
}

export default defineEventHandler(async (event) => {
  const body = await readBody<SubmitTagRequestBody>(event)

  if (getTagDataSource() === 'supabase') {
    throw createError({
      statusCode: 501,
      statusMessage:
        'Supabase submit is not enabled yet. Switch NUXT_TAG_DATA_SOURCE to mock to test submit locally.'
    })
  }

  const riderName = validateRequiredText(
    body.riderName,
    'Rider name',
    maxRiderNameLength
  )

  const foundLocationMapUrl = validateMapUrl(
    body.foundLocationMapUrl,
    'Found location map link'
  )

  const nextTitle = validateRequiredText(
    body.nextTitle,
    'Next tag title',
    maxTitleLength
  )

  const nextClue = validateRequiredText(
    body.nextClue,
    'Next tag clue',
    maxClueLength
  )

  const nextHiddenLocationMapUrl = validateMapUrl(
    body.nextHiddenLocationMapUrl,
    'Hidden location map link'
  )

  const matchPhoto = validateImageMetadata(
    body.matchPhoto,
    'Matching photo'
  )

  const nextPhoto = validateImageMetadata(
    body.nextPhoto,
    'Next tag photo'
  )

  const submitResult = submitTagToStore({
    riderName,
    foundLocationMapUrl,
    nextTitle,
    nextClue,
    nextHiddenLocationMapUrl
  })

  return {
    success: true,
    message: 'Submit tag request validated and saved to mock server store.',
    currentTag: createCurrentTagResponse(submitResult.currentTag),
    foundTagId: submitResult.foundTag.id,
    submission: {
      riderName,
      foundLocationMapUrl,
      nextTitle,
      nextClue,
      matchPhoto: {
        name: matchPhoto.name,
        type: matchPhoto.type,
        size: matchPhoto.size
      },
      nextPhoto: {
        name: nextPhoto.name,
        type: nextPhoto.type,
        size: nextPhoto.size
      }
    }
  }
})