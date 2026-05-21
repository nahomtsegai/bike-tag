import {
  isAllowedImageMimeType,
  isAllowedImageSize
} from '../../../shared/utils/imageValidation'
import { isValidGoogleMapsUrl } from '../../../shared/utils/mapValidation'
import { getTagDataSource } from '../../utils/tagDataSource'
import { createCurrentTagResponse } from '../../utils/tagResponse'
import { submitTagToStore } from '../../utils/tagStore'
import {
  parseSubmitFormData,
  type ParsedSubmitFormData
} from '../../utils/submitFormData'
import { submitBikeTagToSupabase } from '../../utils/supabaseSubmit'
import { uploadBikeTagPhoto } from '../../utils/supabaseStorage'
import { getSupabaseTagById } from '../../utils/supabaseTags'

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

const createPhotoSummary = (
  photo: ParsedSubmitFormData['matchPhoto']
): SubmitPhotoSummary => {
  return {
    name: photo.fileName,
    type: photo.mimeType,
    size: photo.fileBuffer.byteLength
  }
}

const isMultipartRequest = (event: Parameters<typeof getHeader>[0]) => {
  const contentType = getHeader(event, 'content-type') ?? ''

  return contentType.includes('multipart/form-data')
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
    matchPhoto: createPhotoSummary(parsedFormData.matchPhoto),
    nextPhoto: createPhotoSummary(parsedFormData.nextPhoto)
  }
}

const readMockSubmitPayload = async (
  event: Parameters<typeof readBody>[0]
): Promise<SubmitPayload> => {
  if (isMultipartRequest(event)) {
    return await readFormDataSubmitPayload(event)
  }

  return await readJsonSubmitPayload(event)
}

const readSupabaseSubmitPayload = async (
  event: Parameters<typeof readFormData>[0]
) => {
  if (!isMultipartRequest(event)) {
    throw createValidationError(
      'Supabase submit requires multipart form data with photo files.'
    )
  }

  const formData = await readFormData(event)

  return await parseSubmitFormData(formData)
}

const submitToMockStore = async (event: Parameters<typeof readBody>[0]) => {
  const submitPayload = await readMockSubmitPayload(event)

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
}

const submitToSupabase = async (event: Parameters<typeof readFormData>[0]) => {
  const submitPayload = await readSupabaseSubmitPayload(event)

  const matchPhotoUpload = await uploadBikeTagPhoto({
    fileBuffer: submitPayload.matchPhoto.fileBuffer,
    fileName: submitPayload.matchPhoto.fileName,
    mimeType: submitPayload.matchPhoto.mimeType,
    photoType: 'match_photo'
  })

  const nextPhotoUpload = await uploadBikeTagPhoto({
    fileBuffer: submitPayload.nextPhoto.fileBuffer,
    fileName: submitPayload.nextPhoto.fileName,
    mimeType: submitPayload.nextPhoto.mimeType,
    photoType: 'tag_photo'
  })

  const submitResult = await submitBikeTagToSupabase({
    riderName: submitPayload.riderName,
    foundLocationMapUrl: submitPayload.foundLocationMapUrl,
    matchPhotoUrl: matchPhotoUpload.publicUrl,
    nextTitle: submitPayload.nextTitle,
    nextClue: submitPayload.nextClue,
    nextHiddenLocationMapUrl: submitPayload.nextHiddenLocationMapUrl,
    nextTagPhotoUrl: nextPhotoUpload.publicUrl
  })

  const currentTag = await getSupabaseTagById(submitResult.currentTagId)

  return {
    success: true,
    message: 'Submit tag request saved to Supabase.',
    currentTag: createCurrentTagResponse(currentTag),
    foundTagId: submitResult.foundTagId,
    submission: {
      riderName: submitPayload.riderName,
      foundLocationMapUrl: submitPayload.foundLocationMapUrl,
      nextTitle: submitPayload.nextTitle,
      nextClue: submitPayload.nextClue,
      matchPhoto: createPhotoSummary(submitPayload.matchPhoto),
      nextPhoto: createPhotoSummary(submitPayload.nextPhoto)
    }
  }
}

export default defineEventHandler(async (event) => {
  if (getTagDataSource() === 'supabase') {
    return await submitToSupabase(event)
  }

  return await submitToMockStore(event)
})