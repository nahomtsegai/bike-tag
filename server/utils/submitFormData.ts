import {
  isAllowedImageMimeType,
  isAllowedImageMimeTypeAndExtension,
  isAllowedImageSize
} from '~~/shared/utils/imageValidation'
import { isValidGoogleMapsUrl } from '~~/shared/utils/mapValidation'

type SubmitPhotoFieldName = 'matchPhoto' | 'nextPhoto'

type ParsedSubmitPhoto = {
  fileName: string
  mimeType: string
  fileBuffer: Uint8Array
}

export type ParsedSubmitFormData = {
  riderName: string
  foundLocationMapUrl: string
  foundLatitude: number
  foundLongitude: number
  foundLocationAccuracyMeters: number
  foundLocationCapturedAt: string
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

const getNumberField = (
  formData: FormData,
  fieldName: string,
  displayName: string
) => {
  const value = formData.get(fieldName)

  if (typeof value !== 'string' || !value.trim()) {
    throw createSubmitFormDataError(`${displayName} is required.`)
  }

  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) {
    throw createSubmitFormDataError(`${displayName} must be a valid number.`)
  }

  return numberValue
}

const getLatitudeField = (formData: FormData) => {
  const latitude = getNumberField(
    formData,
    'foundLatitude',
    'Found latitude'
  )

  if (latitude < -90 || latitude > 90) {
    throw createSubmitFormDataError('Found latitude is invalid.')
  }

  return latitude
}

const getLongitudeField = (formData: FormData) => {
  const longitude = getNumberField(
    formData,
    'foundLongitude',
    'Found longitude'
  )

  if (longitude < -180 || longitude > 180) {
    throw createSubmitFormDataError('Found longitude is invalid.')
  }

  return longitude
}

const getAccuracyField = (formData: FormData) => {
  const accuracyMeters = getNumberField(
    formData,
    'foundLocationAccuracyMeters',
    'Found location accuracy'
  )

  if (accuracyMeters < 0) {
    throw createSubmitFormDataError('Found location accuracy is invalid.')
  }

  return accuracyMeters
}

const getCapturedAtField = (formData: FormData) => {
  const capturedAt = getTextField(
    formData,
    'foundLocationCapturedAt',
    'Found location captured time',
    80
  )

  const capturedAtDate = new Date(capturedAt)

  if (Number.isNaN(capturedAtDate.getTime())) {
    throw createSubmitFormDataError('Found location captured time is invalid.')
  }

  return capturedAt
}

const createFoundLocationMapUrl = (latitude: number, longitude: number) => {
  return `https://www.google.com/maps?q=${latitude},${longitude}`
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

  if (!isAllowedImageMimeTypeAndExtension(value.type, value.name)) {
    throw createSubmitFormDataError(
      `${displayName} file extension must match the image type.`
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

  const foundLatitude = getLatitudeField(formData)
  const foundLongitude = getLongitudeField(formData)
  const foundLocationAccuracyMeters = getAccuracyField(formData)
  const foundLocationCapturedAt = getCapturedAtField(formData)
  const foundLocationMapUrl = createFoundLocationMapUrl(
    foundLatitude,
    foundLongitude
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
    foundLatitude,
    foundLongitude,
    foundLocationAccuracyMeters,
    foundLocationCapturedAt,
    nextTitle,
    nextClue,
    nextHiddenLocationMapUrl,
    matchPhoto,
    nextPhoto
  }
}