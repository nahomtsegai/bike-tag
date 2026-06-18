import {
  isAllowedCombinedSubmitPhotoSize,
  isHeicImageFile,
  maxCombinedSubmitPhotoSizeInBytes
} from '~~/shared/utils/imageValidation'
import {
  compressImageFile,
  compressImageFileToMaxSize
} from './imageCompression'

export type SubmitPhotoField = 'matchPhoto' | 'nextPhoto'

export class SubmitPhotoPreparationError extends Error {
  readonly field: SubmitPhotoField
  readonly file: File
  readonly originalError: unknown

  constructor(
    field: SubmitPhotoField,
    file: File,
    originalError: unknown
  ) {
    const photoLabel = field === 'matchPhoto'
      ? 'matching photo'
      : 'next tag photo'
    const message = isHeicImageFile(file.type, file.name)
      ? `The ${photoLabel} could not be converted from HEIC or HEIF. Try choosing a JPG, PNG, or WebP version instead.`
      : `The ${photoLabel} could not be processed.`

    super(message)

    this.name = 'SubmitPhotoPreparationError'
    this.field = field
    this.file = file
    this.originalError = originalError
  }
}

export class SubmitPhotoPayloadTooLargeError extends Error {
  readonly matchPhotoSize: number
  readonly nextPhotoSize: number
  readonly maxCombinedSize: number

  constructor({
    matchPhotoSize,
    nextPhotoSize,
    maxCombinedSize
  }: {
    matchPhotoSize: number
    nextPhotoSize: number
    maxCombinedSize: number
  }) {
    super('The prepared photos exceed the combined upload limit.')

    this.name = 'SubmitPhotoPayloadTooLargeError'
    this.matchPhotoSize = matchPhotoSize
    this.nextPhotoSize = nextPhotoSize
    this.maxCombinedSize = maxCombinedSize
  }
}

export const getSubmitPhotoTargetSizes = ({
  matchPhotoSize,
  nextPhotoSize,
  maxCombinedSize = maxCombinedSubmitPhotoSizeInBytes
}: {
  matchPhotoSize: number
  nextPhotoSize: number
  maxCombinedSize?: number
}) => {
  const halfBudget = Math.floor(maxCombinedSize / 2)

  if (matchPhotoSize <= halfBudget) {
    return {
      matchPhotoTargetSize: matchPhotoSize,
      nextPhotoTargetSize: maxCombinedSize - matchPhotoSize
    }
  }

  if (nextPhotoSize <= halfBudget) {
    return {
      matchPhotoTargetSize: maxCombinedSize - nextPhotoSize,
      nextPhotoTargetSize: nextPhotoSize
    }
  }

  return {
    matchPhotoTargetSize: halfBudget,
    nextPhotoTargetSize: maxCombinedSize - halfBudget
  }
}

const preparePhoto = async (
  file: File,
  field: SubmitPhotoField,
  maxSizeInBytes?: number
) => {
  try {
    return maxSizeInBytes === undefined
      ? await compressImageFile(file)
      : await compressImageFileToMaxSize(file, maxSizeInBytes)
  } catch (error) {
    throw new SubmitPhotoPreparationError(field, file, error)
  }
}

export const prepareSubmitPhotos = async ({
  matchPhoto,
  nextPhoto,
  maxCombinedSize = maxCombinedSubmitPhotoSizeInBytes
}: {
  matchPhoto: File
  nextPhoto: File
  maxCombinedSize?: number
}) => {
  let preparedMatchPhoto = await preparePhoto(matchPhoto, 'matchPhoto')
  let preparedNextPhoto = await preparePhoto(nextPhoto, 'nextPhoto')

  if (
    isAllowedCombinedSubmitPhotoSize(
      preparedMatchPhoto.size,
      preparedNextPhoto.size,
      maxCombinedSize
    )
  ) {
    return {
      matchPhoto: preparedMatchPhoto,
      nextPhoto: preparedNextPhoto
    }
  }

  const {
    matchPhotoTargetSize,
    nextPhotoTargetSize
  } = getSubmitPhotoTargetSizes({
    matchPhotoSize: preparedMatchPhoto.size,
    nextPhotoSize: preparedNextPhoto.size,
    maxCombinedSize
  })

  if (preparedMatchPhoto.size > matchPhotoTargetSize) {
    preparedMatchPhoto = await preparePhoto(
      matchPhoto,
      'matchPhoto',
      matchPhotoTargetSize
    )
  }

  if (preparedNextPhoto.size > nextPhotoTargetSize) {
    preparedNextPhoto = await preparePhoto(
      nextPhoto,
      'nextPhoto',
      nextPhotoTargetSize
    )
  }

  if (
    preparedMatchPhoto.size + preparedNextPhoto.size >
    maxCombinedSize
  ) {
    throw new SubmitPhotoPayloadTooLargeError({
      matchPhotoSize: preparedMatchPhoto.size,
      nextPhotoSize: preparedNextPhoto.size,
      maxCombinedSize
    })
  }

  return {
    matchPhoto: preparedMatchPhoto,
    nextPhoto: preparedNextPhoto
  }
}
