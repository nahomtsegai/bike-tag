import {
  isAllowedImageMimeType,
  isAllowedImageSize
} from '../../shared/utils/imageValidation'
import { isValidGoogleMapsUrl } from '../../shared/utils/mapValidation'

type SubmitPhotoFieldName = 'matchPhoto' | 'nextPhoto'

type ParsedSubmitPhoto = {
  fileName: string
  mimeType: string
  fileBuffer: Uint8Array
}

export type ParsedSubmitFormData = {
  riderName: string
  foundLocationMapUrl: string
  nextTitle: string
  nextClue: string
  nextHiddenLocationMapUrl: string
  matchPhoto: ParsedSubmitPhoto
  nextPhoto: ParsedSubmitPhoto
}

const maxRiderNameLength = 50
const maxTitleLength = 80
const maxClueLength = 500
const maxMapUrlLength = 2048

const createSubmitFormDataError = (message: string) => {
  return createError({
    statusCode: 400,
    statusMessage: message
  })
}

const getTextField = (
  formData: FormData,
  fieldName: string,
  displayName: string,
  maxLength: number
) => {
  const value = formData.get(fieldName)

  if (typeof value !== 'string' || !value.trim()) {
    throw createSubmitFormDataError(`${displayName} is required.`)
  }

  const trimmedValue = value.trim()

  if (trimmedValue.length > maxLength) {
    throw createSubmitFormDataError(`${displayName} is too long.`)
  }

  return trimmedValue
}

const getMapUrlField = (
  formData: FormData,
  fieldName: string,
  displayName: string
) => {
  const mapUrl = getTextField(
    formData,
    fieldName,
    displayName,
    maxMapUrlLength
  )

  if (!isValidGoogleMapsUrl(mapUrl)) {
    throw createSubmitFormDataError(
      `${displayName} must be a valid Google Maps link.`
    )
  }

  return mapUrl
}

const getPhotoField = async (
  formData: FormData,
  fieldName: SubmitPhotoFieldName,
  displayName: string
): Promise<ParsedSubmitPhoto> => {
  const value = formData.get(fieldName)

  if (!(value instanceof File)) {
    throw createSubmitFormDataError(`${displayName} is required.`)
  }

  if (!isAllowedImageMimeType(value.type)) {
    throw createSubmitFormDataError(
      `${displayName} must be a jpg, png, or webp image.`
    )
  }

  if (!isAllowedImageSize(value.size)) {
    throw createSubmitFormDataError(`${displayName} must be smaller than 8 MB.`)
  }

  const arrayBuffer = await value.arrayBuffer()

  return {
    fileName: value.name,
    mimeType: value.type,
    fileBuffer: new Uint8Array(arrayBuffer)
  }
}

export const parseSubmitFormData = async (
  formData: FormData
): Promise<ParsedSubmitFormData> => {
  const riderName = getTextField(
    formData,
    'riderName',
    'Rider name',
    maxRiderNameLength
  )

  const foundLocationMapUrl = getMapUrlField(
    formData,
    'foundLocationMapUrl',
    'Found location map link'
  )

  const nextTitle = getTextField(
    formData,
    'nextTitle',
    'Next tag title',
    maxTitleLength
  )

  const nextClue = getTextField(
    formData,
    'nextClue',
    'Next tag clue',
    maxClueLength
  )

  const nextHiddenLocationMapUrl = getMapUrlField(
    formData,
    'nextHiddenLocationMapUrl',
    'Hidden location map link'
  )

  const matchPhoto = await getPhotoField(
    formData,
    'matchPhoto',
    'Matching photo'
  )

  const nextPhoto = await getPhotoField(
    formData,
    'nextPhoto',
    'Next tag photo'
  )

  return {
    riderName,
    foundLocationMapUrl,
    nextTitle,
    nextClue,
    nextHiddenLocationMapUrl,
    matchPhoto,
    nextPhoto
  }
}