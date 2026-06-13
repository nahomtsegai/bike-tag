import {
  doesImageContentMatchMimeType,
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
  foundLatitude: number | null
  foundLongitude: number | null
  foundLocationAccuracyMeters: number | null
  foundLocationCapturedAt: string | null
  nextTitle: string
  nextClue: string
  nextHiddenLocationMapUrl: string
  nextHiddenLatitude: number | null
  nextHiddenLongitude: number | null
  nextHiddenLocationAccuracyMeters: number | null
  nextHiddenLocationCapturedAt: string | null
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
  const value = getTextField(formData, fieldName, displayName, maxMapUrlLength)

  if (!isValidGoogleMapsUrl(value)) {
    throw createSubmitFormDataError(`${displayName} must be a valid map link.`)
  }

  return value
}

const getOptionalTextField = (
  formData: FormData,
  fieldName: string,
  displayName: string,
  maxLength: number
) => {
  const value = formData.get(fieldName)

  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value !== 'string') {
    throw createSubmitFormDataError(`${displayName} is invalid.`)
  }

  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return null
  }

  if (trimmedValue.length > maxLength) {
    throw createSubmitFormDataError(`${displayName} is too long.`)
  }

  return trimmedValue
}

const getOptionalNumberField = (
  formData: FormData,
  fieldName: string,
  displayName: string
) => {
  const value = formData.get(fieldName)

  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value !== 'string' || !value.trim()) {
    return null
  }

  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) {
    throw createSubmitFormDataError(`${displayName} must be a valid number.`)
  }

  return numberValue
}

const getOptionalLatitudeField = (
  formData: FormData,
  fieldName: string,
  displayName: string
) => {
  const latitude = getOptionalNumberField(formData, fieldName, displayName)

  if (latitude === null) {
    return null
  }

  if (latitude < -90 || latitude > 90) {
    throw createSubmitFormDataError(`${displayName} is invalid.`)
  }

  return latitude
}

const getOptionalLongitudeField = (
  formData: FormData,
  fieldName: string,
  displayName: string
) => {
  const longitude = getOptionalNumberField(formData, fieldName, displayName)

  if (longitude === null) {
    return null
  }

  if (longitude < -180 || longitude > 180) {
    throw createSubmitFormDataError(`${displayName} is invalid.`)
  }

  return longitude
}

const getOptionalAccuracyField = (
  formData: FormData,
  fieldName: string,
  displayName: string
) => {
  const accuracyMeters = getOptionalNumberField(
    formData,
    fieldName,
    displayName
  )

  if (accuracyMeters === null) {
    return null
  }

  if (accuracyMeters < 0) {
    throw createSubmitFormDataError(`${displayName} is invalid.`)
  }

  return accuracyMeters
}

const getOptionalCapturedAtField = (
  formData: FormData,
  fieldName: string,
  displayName: string
) => {
  const capturedAt = getOptionalTextField(formData, fieldName, displayName, 80)

  if (capturedAt === null) {
    return null
  }

  const capturedAtDate = new Date(capturedAt)

  if (Number.isNaN(capturedAtDate.getTime())) {
    throw createSubmitFormDataError(`${displayName} is invalid.`)
  }

  return capturedAt
}

const validateCapturedLocationMetadata = ({
  latitude,
  longitude,
  accuracyMeters,
  capturedAt,
  displayName
}: {
  latitude: number | null
  longitude: number | null
  accuracyMeters: number | null
  capturedAt: string | null
  displayName: string
}) => {
  const metadataValues = [latitude, longitude, accuracyMeters, capturedAt]
  const hasAnyMetadata = metadataValues.some((value) => value !== null)

  if (!hasAnyMetadata) {
    return
  }

  const hasAllMetadata = metadataValues.every((value) => value !== null)

  if (!hasAllMetadata) {
    throw createSubmitFormDataError(
      `${displayName} captured location details are incomplete.`
    )
  }
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
  const fileBuffer = new Uint8Array(arrayBuffer)

  if (!doesImageContentMatchMimeType(value.type, fileBuffer)) {
    throw createSubmitFormDataError(
      `${displayName} content must match the image type.`
    )
  }

  return {
    fileName: value.name,
    mimeType: value.type,
    fileBuffer
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

  const foundLatitude = getOptionalLatitudeField(
    formData,
    'foundLatitude',
    'Found latitude'
  )

  const foundLongitude = getOptionalLongitudeField(
    formData,
    'foundLongitude',
    'Found longitude'
  )

  const foundLocationAccuracyMeters = getOptionalAccuracyField(
    formData,
    'foundLocationAccuracyMeters',
    'Found location accuracy'
  )

  const foundLocationCapturedAt = getOptionalCapturedAtField(
    formData,
    'foundLocationCapturedAt',
    'Found location captured time'
  )

  validateCapturedLocationMetadata({
    latitude: foundLatitude,
    longitude: foundLongitude,
    accuracyMeters: foundLocationAccuracyMeters,
    capturedAt: foundLocationCapturedAt,
    displayName: 'Found'
  })

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

  const nextHiddenLatitude = getOptionalLatitudeField(
    formData,
    'nextHiddenLatitude',
    'Next hidden latitude'
  )

  const nextHiddenLongitude = getOptionalLongitudeField(
    formData,
    'nextHiddenLongitude',
    'Next hidden longitude'
  )

  const nextHiddenLocationAccuracyMeters = getOptionalAccuracyField(
    formData,
    'nextHiddenLocationAccuracyMeters',
    'Next hidden location accuracy'
  )

  const nextHiddenLocationCapturedAt = getOptionalCapturedAtField(
    formData,
    'nextHiddenLocationCapturedAt',
    'Next hidden location captured time'
  )

  validateCapturedLocationMetadata({
    latitude: nextHiddenLatitude,
    longitude: nextHiddenLongitude,
    accuracyMeters: nextHiddenLocationAccuracyMeters,
    capturedAt: nextHiddenLocationCapturedAt,
    displayName: 'Next hidden'
  })

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