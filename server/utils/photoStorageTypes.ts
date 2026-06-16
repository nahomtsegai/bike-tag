export type PhotoType = 'tag_photo' | 'match_photo'

export type PhotoInput = {
  fileBuffer: Uint8Array
  fileName: string
  mimeType: string
  photoType: PhotoType
}

export type PublicPhotoInput = PhotoInput & {
  tagId?: string
}

export type PendingPhotoInput = PhotoInput & {
  submissionGroupId: string
}
