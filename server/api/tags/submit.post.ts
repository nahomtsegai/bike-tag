import {
  isAllowedImageMimeType,
  isAllowedImageSize
} from '../../../shared/utils/imageValidation'
import { isValidGoogleMapsUrl } from '../../../shared/utils/mapValidation'
import { getTagDataSource } from '../../utils/tagDataSource'
import { createCurrentTagResponse } from '../../utils/tagResponse'
import { submitTagToStore } from '../../utils/tagStore'
import { parseSubmitFormData } from '../../utils/submitFormData'

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

type SubmitPhotoSummary = {
  name: string
  type: string
  size: number
}

type SubmitPayload = {
  riderName: string
  foundLocationMapUrl: string
  nextTitle: string
  nextClue: string
  nextHiddenLocationMapUrl: string
  matchPhoto: SubmitPhotoSummary
  nextPhoto: SubmitPhotoSummary
}

const maxRiderNameLength = 50
const maxTitleLength = 80
const maxClueLength = 500
const maxMapUrlLength = 2048

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
  const mapUrl = validateRequiredText(value, fieldName, maxMapUrlLength)

  if (!isValidGoogleMapsUrl(mapUrl)) {
    throw createValidationError(`${fieldName} must be a valid Google Maps link.`)
  }

  return mapUrl
}

const validateImageMetadata = (
  imageMetadata: SubmitTagRequestBody['matchPhoto'],
  fieldName: string
): SubmitPhotoSummary => {
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

  return {
    name: imageMetadata.name,
    type: imageMetadata.type,
    size: imageMetadata.size
  }
}

const readJsonSubmitPayload = async (
  event: Parameters<typeof readBody>[0]
): Promise<SubmitPayload> => {
  const body = await readBody<SubmitTagRequestBody>(event)

  return {
    riderName: validateRequiredText(
      body.riderName,
      'Rider name',
      maxRiderNameLength
    ),
    foundLocationMapUrl: validateMapUrl(
      body.foundLocationMapUrl,
      'Found location map link'
    ),
    nextTitle: validateRequiredText(
      body.nextTitle,
      'Next tag title',
      maxTitleLength
    ),
    nextClue: validateRequiredText(
      body.nextClue,
      'Next tag clue',
      maxClueLength
    ),
    nextHiddenLocationMapUrl: validateMapUrl(
      body.nextHiddenLocationMapUrl,
      'Hidden location map link'
    ),
    matchPhoto: validateImageMetadata(body.matchPhoto, 'Matching photo'),
    nextPhoto: validateImageMetadata(body.nextPhoto, 'Next tag photo')
  }
}

const readFormDataSubmitPayload = async (
  event: Parameters<typeof readFormData>[0]
): Promise<SubmitPayload> => {
  const formData = await readFormData(event)
  const parsedFormData = await parseSubmitFormData(formData)

  return {
    riderName: parsedFormData.riderName,
    foundLocationMapUrl: parsedFormData.foundLocationMapUrl,
    nextTitle: parsedFormData.nextTitle,
    nextClue: parsedFormData.nextClue,
    nextHiddenLocationMapUrl: parsedFormData.nextHiddenLocationMapUrl,
    matchPhoto: {
      name: parsedFormData.matchPhoto.fileName,
      type: parsedFormData.matchPhoto.mimeType,
      size: parsedFormData.matchPhoto.fileBuffer.byteLength
    },
    nextPhoto: {
      name: parsedFormData.nextPhoto.fileName,
      type: parsedFormData.nextPhoto.mimeType,
      size: parsedFormData.nextPhoto.fileBuffer.byteLength
    }
  }
}

const readSubmitPayload = async (
  event: Parameters<typeof readBody>[0]
): Promise<SubmitPayload> => {
  const contentType = getHeader(event, 'content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    return await readFormDataSubmitPayload(event)
  }

  return await readJsonSubmitPayload(event)
}

export default defineEventHandler(async (event) => {
  if (getTagDataSource() === 'supabase') {
    throw createError({
      statusCode: 501,
      statusMessage:
        'Supabase submit is not enabled yet. Switch NUXT_TAG_DATA_SOURCE to mock to test submit locally.'
    })
  }

  const submitPayload = await readSubmitPayload(event)

  const submitResult = submitTagToStore({
    riderName: submitPayload.riderName,
    foundLocationMapUrl: submitPayload.foundLocationMapUrl,
    nextTitle: submitPayload.nextTitle,
    nextClue: submitPayload.nextClue,
    nextHiddenLocationMapUrl: submitPayload.nextHiddenLocationMapUrl
  })

  return {
    success: true,
    message: 'Submit tag request validated and saved to mock server store.',
    currentTag: createCurrentTagResponse(submitResult.currentTag),
    foundTagId: submitResult.foundTag.id,
    submission: {
      riderName: submitPayload.riderName,
      foundLocationMapUrl: submitPayload.foundLocationMapUrl,
      nextTitle: submitPayload.nextTitle,
      nextClue: submitPayload.nextClue,
      matchPhoto: submitPayload.matchPhoto,
      nextPhoto: submitPayload.nextPhoto
    }
  }
})