import {
  isAllowedImageMimeType,
  isAllowedImageMimeTypeAndExtension,
  isAllowedImageSize
} from '~~/shared/utils/imageValidation'

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
  nextHiddenLatitude: number
  nextHiddenLongitude: number
  nextHiddenLocationAccuracyMeters: number
  nextHiddenLocationCapturedAt: string
  matchPhoto: ParsedSubmitPhoto
  nextPhoto: ParsedSubmitPhoto
}

const maxRiderNameLength = 50
const maxTitleLength = 80
const maxClueLength = 500

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

const getLatitudeField = (
  formData: FormData,
  fieldName: string,
  displayName: string
) => {
  const latitude = getNumberField(formData, fieldName, displayName)

  if (latitude < -90 || latitude > 90) {
    throw createSubmitFormDataError(`${displayName} is invalid.`)
  }

  return latitude
}

const getLongitudeField = (
  formData: FormData,
  fieldName: string,
  displayName: string
) => {
  const longitude = getNumberField(formData, fieldName, displayName)

  if (longitude < -180 || longitude > 180) {
    throw createSubmitFormDataError(`${displayName} is invalid.`)
  }

  return longitude
}

const getAccuracyField = (
  formData: FormData,
  fieldName: string,
  displayName: string
) => {
  const accuracyMeters = getNumberField(formData, fieldName, displayName)

  if (accuracyMeters < 0) {
    throw createSubmitFormDataError(`${displayName} is invalid.`)
  }

  return accuracyMeters
}

const getCapturedAtField = (
  formData: FormData,
  fieldName: string,
  displayName: string
) => {
  const capturedAt = getTextField(
    formData,
    fieldName,
    displayName,
    80
  )

  const capturedAtDate = new Date(capturedAt)

  if (Number.isNaN(capturedAtDate.getTime())) {
    throw createSubmitFormDataError(`${displayName} is invalid.`)
  }

  return capturedAt
}

const createLocationMapUrl = (latitude: number, longitude: number) => {
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

  const foundLatitude = getLatitudeField(
    formData,
    'foundLatitude',
    'Found latitude'
  )

  const foundLongitude = getLongitudeField(
    formData,
    'foundLongitude',
    'Found longitude'
  )

  const foundLocationAccuracyMeters = getAccuracyField(
    formData,
    'foundLocationAccuracyMeters',
    'Found location accuracy'
  )

  const foundLocationCapturedAt = getCapturedAtField(
    formData,
    'foundLocationCapturedAt',
    'Found location captured time'
  )

  const foundLocationMapUrl = createLocationMapUrl(
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

  const nextHiddenLatitude = getLatitudeField(
    formData,
    'nextHiddenLatitude',
    'Next hidden latitude'
  )

  const nextHiddenLongitude = getLongitudeField(
    formData,
    'nextHiddenLongitude',
    'Next hidden longitude'
  )

  const nextHiddenLocationAccuracyMeters = getAccuracyField(
    formData,
    'nextHiddenLocationAccuracyMeters',
    'Next hidden location accuracy'
  )

  const nextHiddenLocationCapturedAt = getCapturedAtField(
    formData,
    'nextHiddenLocationCapturedAt',
    'Next hidden location captured time'
  )

  const nextHiddenLocationMapUrl = createLocationMapUrl(
    nextHiddenLatitude,
    nextHiddenLongitude
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
    nextHiddenLatitude,
    nextHiddenLongitude,
    nextHiddenLocationAccuracyMeters,
    nextHiddenLocationCapturedAt,
    matchPhoto,
    nextPhoto
  }
}