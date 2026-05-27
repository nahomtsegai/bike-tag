import {
  getImageErrorKey,
  type AdminImageType
} from './adminSubmissions'

type HasAdminImageErrorOptions = {
  failedImageKeys: Set<string>
  submissionId: string
  imageType: AdminImageType
}

type AddAdminImageErrorOptions = {
  failedImageKeys: Set<string>
  submissionId: string
  imageType: AdminImageType
}

export const hasAdminImageError = ({
  failedImageKeys,
  submissionId,
  imageType
}: HasAdminImageErrorOptions) => {
  return failedImageKeys.has(getImageErrorKey(submissionId, imageType))
}

export const addAdminImageError = ({
  failedImageKeys,
  submissionId,
  imageType
}: AddAdminImageErrorOptions) => {
  return new Set([
    ...failedImageKeys,
    getImageErrorKey(submissionId, imageType)
  ])
}