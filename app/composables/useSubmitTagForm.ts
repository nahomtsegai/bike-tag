import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch
} from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import {
  allowedImageFileTypesLabel,
  isAllowedImageMimeTypeAndExtension,
  isAllowedImageSize,
  maxImageFileSizeLabel
} from '~~/shared/utils/imageValidation'
import {
  clearSubmitTagDraft,
  loadSubmitTagDraft,
  saveSubmitTagDraft,
  type SubmitTagDraft
} from '../utils/submitTagDraftStorage'
import {
  getFirstSubmitTagErrorField,
  getSubmitTagValidationSummary,
  type SubmitTagErrorField,
  type SubmitTagFormErrors
} from '../utils/submitTagValidation'
import { useSubmitDiagnostics } from './useSubmitDiagnostics'
import { useTagApi } from './useTagApi'
import { compressImageFile } from '../utils/imageCompression'

type CapturedLocation = {
  latitude: number
  longitude: number
  accuracyMeters: number
  capturedAt: string
}

type BrowserConnection = {
  effectiveType?: string
  downlink?: number
  rtt?: number
}

const getSubmitErrorMessage = (error: unknown) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'statusMessage' in error &&
    typeof error.statusMessage === 'string'
  ) {
    return error.statusMessage
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'data' in error &&
    typeof error.data === 'object' &&
    error.data !== null &&
    'statusMessage' in error.data &&
    typeof error.data.statusMessage === 'string'
  ) {
    return error.data.statusMessage
  }

  return 'Something went wrong while submitting this tag. Check the form details and try again.'
}

const createLocationMapUrl = (latitude: number, longitude: number) => {
  return `https://www.google.com/maps?q=${latitude},${longitude}`
}

const formatCoordinate = (coordinate: number | null) => {
  if (coordinate === null) {
    return 'Not captured'
  }

  return coordinate.toFixed(6)
}

const formatAccuracy = (accuracyMeters: number | null) => {
  if (accuracyMeters === null) {
    return 'Not available'
  }

  return `${Math.round(accuracyMeters)} meters`
}

const formatCapturedAt = (capturedAt: string | null) => {
  if (!capturedAt) {
    return 'Not captured'
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(capturedAt))
}

const getGeolocationErrorMessage = (error: GeolocationPositionError) => {
  if (error.code === error.PERMISSION_DENIED) {
    return 'Location permission was denied. Allow location access, then try again.'
  }

  if (error.code === error.POSITION_UNAVAILABLE) {
    return 'Your location could not be found. Move outside or try again near the tag.'
  }

  if (error.code === error.TIMEOUT) {
    return 'Location capture timed out. Try again with a clearer GPS signal.'
  }

  return 'Could not capture your location. Try again near the tag.'
}

const isValidMapUrl = (value: string) => {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return false
  }

  try {
    const url = new URL(trimmedValue)

    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

export const useSubmitTagForm = () => {
  const { submitTag } = useTagApi()
  const { trackSubmitEvent } = useSubmitDiagnostics()

  const formElement = ref<HTMLFormElement | null>(null)
  const isReviewing = ref(false)
  const isSubmitting = ref(false)
  const isCapturingFoundLocation = ref(false)
  const isCapturingNextHiddenLocation = ref(false)
  const isDraftRestored = ref(false)
  const shouldPersistDraft = ref(false)
  const submitError = ref('')
  const submitWarning = ref('')
  const submitStatusMessage = ref('')
  const isCompressingPhotos = ref(false)
  const isNavigatingAfterSuccessfulSubmit = ref(false)
  const matchPhotoPreviewUrl = ref<string | null>(null)
  const nextPhotoPreviewUrl = ref<string | null>(null)

  const form = reactive({
    riderName: '',
    foundLocationMapUrl: '',
    foundLatitude: null as number | null,
    foundLongitude: null as number | null,
    foundLocationAccuracyMeters: null as number | null,
    foundLocationCapturedAt: null as string | null,
    matchPhoto: null as File | null,
    notes: '',
    nextTitle: '',
    nextClue: '',
    nextHiddenLocationMapUrl: '',
    nextHiddenLatitude: null as number | null,
    nextHiddenLongitude: null as number | null,
    nextHiddenLocationAccuracyMeters: null as number | null,
    nextHiddenLocationCapturedAt: null as string | null,
    nextPhoto: null as File | null
  })

  const errors = reactive<SubmitTagFormErrors>({})

  const hasCapturedFoundLocation = computed(() => {
    return Boolean(
      form.foundLatitude !== null &&
        form.foundLongitude !== null &&
        form.foundLocationAccuracyMeters !== null &&
        form.foundLocationCapturedAt
    )
  })

  const hasCapturedNextHiddenLocation = computed(() => {
    return Boolean(
      form.nextHiddenLatitude !== null &&
        form.nextHiddenLongitude !== null &&
        form.nextHiddenLocationAccuracyMeters !== null &&
        form.nextHiddenLocationCapturedAt
    )
  })

  const foundLocationDisplay = computed(() => {
    return {
      latitude: formatCoordinate(form.foundLatitude),
      longitude: formatCoordinate(form.foundLongitude),
      accuracy: formatAccuracy(form.foundLocationAccuracyMeters),
      capturedAt: formatCapturedAt(form.foundLocationCapturedAt)
    }
  })

  const nextHiddenLocationDisplay = computed(() => {
    return {
      latitude: formatCoordinate(form.nextHiddenLatitude),
      longitude: formatCoordinate(form.nextHiddenLongitude),
      accuracy: formatAccuracy(form.nextHiddenLocationAccuracyMeters),
      capturedAt: formatCapturedAt(form.nextHiddenLocationCapturedAt)
    }
  })

  const submitTagDraft = computed<SubmitTagDraft>(() => {
    return {
      riderName: form.riderName,
      foundLocationMapUrl: form.foundLocationMapUrl,
      foundLatitude: form.foundLatitude,
      foundLongitude: form.foundLongitude,
      foundLocationAccuracyMeters: form.foundLocationAccuracyMeters,
      foundLocationCapturedAt: form.foundLocationCapturedAt,
      notes: form.notes,
      nextTitle: form.nextTitle,
      nextClue: form.nextClue,
      nextHiddenLocationMapUrl: form.nextHiddenLocationMapUrl,
      nextHiddenLatitude: form.nextHiddenLatitude,
      nextHiddenLongitude: form.nextHiddenLongitude,
      nextHiddenLocationAccuracyMeters:
        form.nextHiddenLocationAccuracyMeters,
      nextHiddenLocationCapturedAt: form.nextHiddenLocationCapturedAt
    }
  })

  const restoreDraft = (draft: SubmitTagDraft) => {
    form.riderName = draft.riderName
    form.foundLocationMapUrl = draft.foundLocationMapUrl
    form.foundLatitude = draft.foundLatitude
    form.foundLongitude = draft.foundLongitude
    form.foundLocationAccuracyMeters = draft.foundLocationAccuracyMeters
    form.foundLocationCapturedAt = draft.foundLocationCapturedAt
    form.notes = draft.notes
    form.nextTitle = draft.nextTitle
    form.nextClue = draft.nextClue
    form.nextHiddenLocationMapUrl = draft.nextHiddenLocationMapUrl
    form.nextHiddenLatitude = draft.nextHiddenLatitude
    form.nextHiddenLongitude = draft.nextHiddenLongitude
    form.nextHiddenLocationAccuracyMeters =
      draft.nextHiddenLocationAccuracyMeters
    form.nextHiddenLocationCapturedAt = draft.nextHiddenLocationCapturedAt
  }

  const createSubmitFormData = () => {
    const submitFormData = new FormData()

    submitFormData.append('riderName', form.riderName)
    submitFormData.append('foundLocationMapUrl', form.foundLocationMapUrl)
    submitFormData.append('nextTitle', form.nextTitle)
    submitFormData.append('nextClue', form.nextClue)
    submitFormData.append(
      'nextHiddenLocationMapUrl',
      form.nextHiddenLocationMapUrl
    )

    if (form.foundLatitude !== null) {
      submitFormData.append('foundLatitude', String(form.foundLatitude))
    }

    if (form.foundLongitude !== null) {
      submitFormData.append('foundLongitude', String(form.foundLongitude))
    }

    if (form.foundLocationAccuracyMeters !== null) {
      submitFormData.append(
        'foundLocationAccuracyMeters',
        String(form.foundLocationAccuracyMeters)
      )
    }

    if (form.foundLocationCapturedAt) {
      submitFormData.append(
        'foundLocationCapturedAt',
        form.foundLocationCapturedAt
      )
    }

    if (form.matchPhoto) {
      submitFormData.append('matchPhoto', form.matchPhoto)
    }

    if (form.nextPhoto) {
      submitFormData.append('nextPhoto', form.nextPhoto)
    }

    return submitFormData
  }

  const hasUnsavedChanges = computed(() => {
    return Boolean(
      form.riderName.trim() ||
        form.foundLocationMapUrl.trim() ||
        form.matchPhoto ||
        form.notes.trim() ||
        form.nextTitle.trim() ||
        form.nextClue.trim() ||
        form.nextHiddenLocationMapUrl.trim() ||
        form.nextPhoto
    )
  })

  const hasDraftContent = computed(() => {
    return Boolean(
      form.riderName.trim() ||
        form.foundLocationMapUrl.trim() ||
        form.notes.trim() ||
        form.nextTitle.trim() ||
        form.nextClue.trim() ||
        form.nextHiddenLocationMapUrl.trim()
    )
  })

  const isFormReady = computed(() => {
    return Boolean(
      form.riderName.trim() &&
        form.foundLocationMapUrl.trim() &&
        form.matchPhoto &&
        form.nextTitle.trim() &&
        form.nextClue.trim() &&
        form.nextHiddenLocationMapUrl.trim() &&
        form.nextPhoto
    )
  })

  const firstErrorField = computed(() => {
    return getFirstSubmitTagErrorField(errors)
  })

  const validationSummary = computed(() => {
    return getSubmitTagValidationSummary(errors)
  })

  const matchPhotoName = computed(() => {
    return form.matchPhoto?.name ?? 'No file selected'
  })

  const nextPhotoName = computed(() => {
    return form.nextPhoto?.name ?? 'No file selected'
  })

  const getBrowserDiagnosticMetadata = () => {
    if (!import.meta.client) {
      return {}
    }

    const connection =
      'connection' in navigator
        ? (navigator.connection as BrowserConnection)
        : null

    return {
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      devicePixelRatio: window.devicePixelRatio,
      onlineStatus: navigator.onLine,
      connectionEffectiveType:
        connection && typeof connection.effectiveType === 'string'
          ? connection.effectiveType
          : null,
      connectionDownlink:
        connection && typeof connection.downlink === 'number'
          ? connection.downlink
          : null,
      connectionRtt:
        connection && typeof connection.rtt === 'number'
          ? connection.rtt
          : null
    }
  }

  const getFileExtension = (fileName: string | undefined) => {
    if (!fileName) {
      return null
    }

    const extension = fileName.split('.').pop()

    return extension ? extension.toLowerCase() : null
  }

  const getPhotoDiagnosticMetadata = () => {
    return {
      matchPhotoType: form.matchPhoto?.type || null,
      matchPhotoSize: form.matchPhoto?.size || null,
      matchPhotoLastModified: form.matchPhoto?.lastModified || null,
      matchPhotoExtension: getFileExtension(form.matchPhoto?.name),
      nextPhotoType: form.nextPhoto?.type || null,
      nextPhotoSize: form.nextPhoto?.size || null,
      nextPhotoLastModified: form.nextPhoto?.lastModified || null,
      nextPhotoExtension: getFileExtension(form.nextPhoto?.name)
    }
  }

  const getSubmitDiagnosticMetadata = () => {
    return {
      ...getBrowserDiagnosticMetadata(),
      ...getPhotoDiagnosticMetadata(),
      isReviewing: isReviewing.value,
      isSubmitting: isSubmitting.value,
      isCompressingPhotos: isCompressingPhotos.value,
      submitStatusMessage: submitStatusMessage.value,
      hasRiderName: Boolean(form.riderName.trim()),
      hasFoundLocationMapUrl: Boolean(form.foundLocationMapUrl.trim()),
      hasFoundGpsMetadata: hasCapturedFoundLocation.value,
      hasMatchPhoto: Boolean(form.matchPhoto),
      hasNextTitle: Boolean(form.nextTitle.trim()),
      hasNextClue: Boolean(form.nextClue.trim()),
      hasNextHiddenLocationMapUrl: Boolean(
        form.nextHiddenLocationMapUrl.trim()
      ),
      hasNextHiddenGpsMetadata: hasCapturedNextHiddenLocation.value,
      hasNextPhoto: Boolean(form.nextPhoto),
      foundLocationAccuracyMeters: form.foundLocationAccuracyMeters,
      nextHiddenLocationAccuracyMeters: form.nextHiddenLocationAccuracyMeters,
      errorFields: Object.entries(errors)
        .filter(([, value]) => Boolean(value))
        .map(([fieldName]) => fieldName)
    }
  }

  const clearErrors = () => {
    errors.riderName = undefined
    errors.foundLocationMapUrl = undefined
    errors.matchPhoto = undefined
    errors.nextTitle = undefined
    errors.nextClue = undefined
    errors.nextHiddenLocationMapUrl = undefined
    errors.nextPhoto = undefined
  }

  const clearFieldError = (fieldName: SubmitTagErrorField) => {
    errors[fieldName] = undefined
    submitError.value = ''
    submitWarning.value = ''
    submitStatusMessage.value = ''
  }

  const clearSubmitFeedback = () => {
    submitError.value = ''
    submitWarning.value = ''
    submitStatusMessage.value = ''
  }

  const clearPreviewUrl = (previewUrl: string | null) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
  }

  const clearImagePreviews = () => {
    clearPreviewUrl(matchPhotoPreviewUrl.value)
    clearPreviewUrl(nextPhotoPreviewUrl.value)

    matchPhotoPreviewUrl.value = null
    nextPhotoPreviewUrl.value = null
  }

  const clearCapturedFoundLocation = () => {
    form.foundLocationMapUrl = ''
    form.foundLatitude = null
    form.foundLongitude = null
    form.foundLocationAccuracyMeters = null
    form.foundLocationCapturedAt = null
    errors.foundLocationMapUrl = undefined
    clearSubmitFeedback()
  }

  const clearCapturedNextHiddenLocation = () => {
    form.nextHiddenLocationMapUrl = ''
    form.nextHiddenLatitude = null
    form.nextHiddenLongitude = null
    form.nextHiddenLocationAccuracyMeters = null
    form.nextHiddenLocationCapturedAt = null
    errors.nextHiddenLocationMapUrl = undefined
    clearSubmitFeedback()
  }

  const setCapturedFoundLocation = ({
    latitude,
    longitude,
    accuracyMeters,
    capturedAt
  }: CapturedLocation) => {
    form.foundLatitude = latitude
    form.foundLongitude = longitude
    form.foundLocationAccuracyMeters = accuracyMeters
    form.foundLocationCapturedAt = capturedAt
    form.foundLocationMapUrl = createLocationMapUrl(latitude, longitude)
    errors.foundLocationMapUrl = undefined
    clearSubmitFeedback()

    if (accuracyMeters > 100) {
      submitWarning.value =
        'Match location captured, but accuracy is wider than 100 meters. Move outside or closer to the tag and try again if possible.'
    }
  }

  const setCapturedNextHiddenLocation = ({
    latitude,
    longitude,
    accuracyMeters,
    capturedAt
  }: CapturedLocation) => {
    form.nextHiddenLatitude = latitude
    form.nextHiddenLongitude = longitude
    form.nextHiddenLocationAccuracyMeters = accuracyMeters
    form.nextHiddenLocationCapturedAt = capturedAt
    form.nextHiddenLocationMapUrl = createLocationMapUrl(latitude, longitude)
    errors.nextHiddenLocationMapUrl = undefined
    clearSubmitFeedback()

    if (accuracyMeters > 100) {
      submitWarning.value =
        'Next hidden location captured, but accuracy is wider than 100 meters. Move outside or closer to the spot and try again if possible.'
    }
  }

  const clearFoundCapturedMetadataForManualLink = () => {
    form.foundLatitude = null
    form.foundLongitude = null
    form.foundLocationAccuracyMeters = null
    form.foundLocationCapturedAt = null
  }

  const clearNextHiddenCapturedMetadataForManualLink = () => {
    form.nextHiddenLatitude = null
    form.nextHiddenLongitude = null
    form.nextHiddenLocationAccuracyMeters = null
    form.nextHiddenLocationCapturedAt = null
  }

  const captureLocation = async () => {
    if (!import.meta.client) {
      return null
    }

    if (!('geolocation' in navigator)) {
      throw new Error(
        'Your browser does not support location capture. Try another browser or device.'
      )
    }

    const position = await new Promise<GeolocationPosition>(
      (resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 15000
        })
      }
    )

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracyMeters: position.coords.accuracy,
      capturedAt: new Date().toISOString()
    }
  }

  const captureFoundLocation = async () => {
    isCapturingFoundLocation.value = true
    errors.foundLocationMapUrl = undefined
    clearSubmitFeedback()

    void trackSubmitEvent({
      eventName: 'location_capture_started',
      step: 'found_location',
      metadata: getSubmitDiagnosticMetadata()
    })

    try {
      const location = await captureLocation()

      if (location) {
        setCapturedFoundLocation(location)

        void trackSubmitEvent({
          eventName: 'location_capture_succeeded',
          step: 'found_location',
          metadata: {
            ...getSubmitDiagnosticMetadata(),
            accuracyMeters: Math.round(location.accuracyMeters)
          }
        })
      }
    } catch (error) {
      let errorMessage =
        'Could not capture the match location. Try again or paste a map link.'

      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        typeof error.code === 'number'
      ) {
        errorMessage = getGeolocationErrorMessage(
          error as GeolocationPositionError
        )
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      errors.foundLocationMapUrl = errorMessage

      void trackSubmitEvent({
        eventName: 'location_capture_failed',
        step: 'found_location',
        message: errorMessage,
        metadata: getSubmitDiagnosticMetadata()
      })
    } finally {
      isCapturingFoundLocation.value = false
    }
  }

  const captureNextHiddenLocation = async () => {
    isCapturingNextHiddenLocation.value = true
    errors.nextHiddenLocationMapUrl = undefined
    clearSubmitFeedback()

    void trackSubmitEvent({
      eventName: 'location_capture_started',
      step: 'next_hidden_location',
      metadata: getSubmitDiagnosticMetadata()
    })

    try {
      const location = await captureLocation()

      if (location) {
        setCapturedNextHiddenLocation(location)

        void trackSubmitEvent({
          eventName: 'location_capture_succeeded',
          step: 'next_hidden_location',
          metadata: {
            ...getSubmitDiagnosticMetadata(),
            accuracyMeters: Math.round(location.accuracyMeters)
          }
        })
      }
    } catch (error) {
      let errorMessage =
        'Could not capture the next hidden location. Try again or paste a map link.'

      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        typeof error.code === 'number'
      ) {
        errorMessage = getGeolocationErrorMessage(
          error as GeolocationPositionError
        )
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      errors.nextHiddenLocationMapUrl = errorMessage

      void trackSubmitEvent({
        eventName: 'location_capture_failed',
        step: 'next_hidden_location',
        message: errorMessage,
        metadata: getSubmitDiagnosticMetadata()
      })
    } finally {
      isCapturingNextHiddenLocation.value = false
    }
  }

  const validateImageFile = (
    file: File | null,
    emptyMessage: string,
    invalidTypeMessage: string,
    tooLargeMessage: string
  ) => {
    if (!file) {
      return emptyMessage
    }

    if (!isAllowedImageMimeTypeAndExtension(file.type, file.name)) {
      return invalidTypeMessage
    }

    if (!isAllowedImageSize(file.size)) {
      return tooLargeMessage
    }

    return ''
  }

  const validateForm = () => {
    clearErrors()

    if (!form.riderName.trim()) {
      errors.riderName = 'Enter your name.'
    }

    if (!form.foundLocationMapUrl.trim()) {
      errors.foundLocationMapUrl =
        'Use your current location or paste a map link for the match location.'
    } else if (!isValidMapUrl(form.foundLocationMapUrl)) {
      errors.foundLocationMapUrl =
        'Enter a valid map link for the match location.'
    }

    const matchPhotoError = validateImageFile(
      form.matchPhoto,
      'Add a matching photo for the current tag.',
      `Choose a ${allowedImageFileTypesLabel} image for the matching tag photo.`,
      `Choose a matching tag photo smaller than ${maxImageFileSizeLabel}.`
    )

    if (matchPhotoError) {
      errors.matchPhoto = matchPhotoError
    }

    if (!form.nextTitle.trim()) {
      errors.nextTitle = 'Enter a title for the next tag.'
    }

    if (!form.nextClue.trim()) {
      errors.nextClue = 'Enter the clue that will unlock after 5 days.'
    }

    if (!form.nextHiddenLocationMapUrl.trim()) {
      errors.nextHiddenLocationMapUrl =
        'Use your current location or paste a hidden map link for the next tag.'
    } else if (!isValidMapUrl(form.nextHiddenLocationMapUrl)) {
      errors.nextHiddenLocationMapUrl =
        'Enter a valid hidden map link for the next tag.'
    }

    const nextPhotoError = validateImageFile(
      form.nextPhoto,
      'Add a photo for the next tag.',
      `Choose a ${allowedImageFileTypesLabel} image for the next tag photo.`,
      `Choose a next tag photo smaller than ${maxImageFileSizeLabel}.`
    )

    if (nextPhotoError) {
      errors.nextPhoto = nextPhotoError
    }

    return !Object.values(errors).some(Boolean)
  }

  const scrollToFirstErrorField = async () => {
    await nextTick()

    if (!firstErrorField.value) {
      return
    }

    const fieldElement = formElement.value?.querySelector(
      `[data-submit-field="${firstErrorField.value}"]`
    )

    fieldElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })

    const focusableElement = fieldElement?.querySelector<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLButtonElement
    >('input, textarea, select, button')

    focusableElement?.focus()
  }

  const resetForm = () => {
    form.riderName = ''
    clearCapturedFoundLocation()
    form.matchPhoto = null
    form.notes = ''
    form.nextTitle = ''
    form.nextClue = ''
    clearCapturedNextHiddenLocation()
    form.nextPhoto = null
    isReviewing.value = false
    isDraftRestored.value = false
    clearImagePreviews()
    formElement.value?.reset()
  }

  const clearSavedDraft = () => {
    clearSubmitTagDraft()
    resetForm()
    clearErrors()
    clearSubmitFeedback()
  }

  const handleMatchPhotoChange = (event: Event) => {
    const input = event.target as HTMLInputElement
    const selectedFile = input.files?.[0] ?? null

    clearPreviewUrl(matchPhotoPreviewUrl.value)

    form.matchPhoto = null
    matchPhotoPreviewUrl.value = null
    errors.matchPhoto = undefined
    clearSubmitFeedback()

    if (!selectedFile) {
      return
    }

    if (
      !isAllowedImageMimeTypeAndExtension(selectedFile.type, selectedFile.name)
    ) {
      errors.matchPhoto = `Choose a ${allowedImageFileTypesLabel} image for the matching tag photo.`
      input.value = ''

      void trackSubmitEvent({
        eventName: 'photo_rejected',
        step: 'match_photo',
        message: errors.matchPhoto,
        metadata: {
          ...getSubmitDiagnosticMetadata(),
          mimeType: selectedFile.type,
          fileSizeBytes: selectedFile.size,
          reason: 'invalid_type_or_extension'
        }
      })

      return
    }

    if (!isAllowedImageSize(selectedFile.size)) {
      errors.matchPhoto = `Choose a matching tag photo smaller than ${maxImageFileSizeLabel}.`
      input.value = ''

      void trackSubmitEvent({
        eventName: 'photo_rejected',
        step: 'match_photo',
        message: errors.matchPhoto,
        metadata: {
          ...getSubmitDiagnosticMetadata(),
          mimeType: selectedFile.type,
          fileSizeBytes: selectedFile.size,
          reason: 'file_too_large'
        }
      })

      return
    }

    form.matchPhoto = selectedFile
    matchPhotoPreviewUrl.value = URL.createObjectURL(selectedFile)

    void trackSubmitEvent({
      eventName: 'photo_selected',
      step: 'match_photo',
      metadata: {
        ...getSubmitDiagnosticMetadata(),
        mimeType: selectedFile.type,
        fileSizeBytes: selectedFile.size
      }
    })
  }

  const handleNextPhotoChange = (event: Event) => {
    const input = event.target as HTMLInputElement
    const selectedFile = input.files?.[0] ?? null

    clearPreviewUrl(nextPhotoPreviewUrl.value)

    form.nextPhoto = null
    nextPhotoPreviewUrl.value = null
    errors.nextPhoto = undefined
    clearSubmitFeedback()

    if (!selectedFile) {
      return
    }

    if (
      !isAllowedImageMimeTypeAndExtension(selectedFile.type, selectedFile.name)
    ) {
      errors.nextPhoto = `Choose a ${allowedImageFileTypesLabel} image for the next tag photo.`
      input.value = ''

      void trackSubmitEvent({
        eventName: 'photo_rejected',
        step: 'next_photo',
        message: errors.nextPhoto,
        metadata: {
          ...getSubmitDiagnosticMetadata(),
          mimeType: selectedFile.type,
          fileSizeBytes: selectedFile.size,
          reason: 'invalid_type_or_extension'
        }
      })

      return
    }

    if (!isAllowedImageSize(selectedFile.size)) {
      errors.nextPhoto = `Choose a next tag photo smaller than ${maxImageFileSizeLabel}.`
      input.value = ''

      void trackSubmitEvent({
        eventName: 'photo_rejected',
        step: 'next_photo',
        message: errors.nextPhoto,
        metadata: {
          ...getSubmitDiagnosticMetadata(),
          mimeType: selectedFile.type,
          fileSizeBytes: selectedFile.size,
          reason: 'file_too_large'
        }
      })

      return
    }

    form.nextPhoto = selectedFile
    nextPhotoPreviewUrl.value = URL.createObjectURL(selectedFile)

    void trackSubmitEvent({
      eventName: 'photo_selected',
      step: 'next_photo',
      metadata: {
        ...getSubmitDiagnosticMetadata(),
        mimeType: selectedFile.type,
        fileSizeBytes: selectedFile.size
      }
    })
  }

  const handleReview = async () => {
    submitError.value = ''
    submitWarning.value = ''

    void trackSubmitEvent({
      eventName: 'review_clicked',
      step: 'review',
      metadata: getSubmitDiagnosticMetadata()
    })

    if (!validateForm()) {
      void trackSubmitEvent({
        eventName: 'review_validation_failed',
        step: 'review',
        metadata: getSubmitDiagnosticMetadata()
      })

      await scrollToFirstErrorField()

      return
    }

    isReviewing.value = true

    void trackSubmitEvent({
      eventName: 'review_opened',
      step: 'review',
      metadata: getSubmitDiagnosticMetadata()
    })

    await nextTick()

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleEdit = async () => {
    if (isSubmitting.value) {
      return
    }

    isReviewing.value = false

    void trackSubmitEvent({
      eventName: 'review_edit_clicked',
      step: 'review',
      metadata: getSubmitDiagnosticMetadata()
    })

    await nextTick()

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const compressSubmitPhotos = async () => {
    if (!form.matchPhoto || !form.nextPhoto) {
      return
    }

    isCompressingPhotos.value = true
    submitStatusMessage.value =
      'Preparing your photos. Large images may be compressed before upload…'

    try {
      const originalMatchPhotoSize = form.matchPhoto.size
      const originalNextPhotoSize = form.nextPhoto.size

      const [compressedMatchPhoto, compressedNextPhoto] = await Promise.all([
        compressImageFile(form.matchPhoto),
        compressImageFile(form.nextPhoto)
      ])

      form.matchPhoto = compressedMatchPhoto
      form.nextPhoto = compressedNextPhoto

      void trackSubmitEvent({
        eventName: 'submit_photos_prepared',
        step: 'photo-compression',
        metadata: {
          ...getSubmitDiagnosticMetadata(),
          originalMatchPhotoSize,
          compressedMatchPhotoSize: compressedMatchPhoto.size,
          originalNextPhotoSize,
          compressedNextPhotoSize: compressedNextPhoto.size,
          didCompressMatchPhoto:
            compressedMatchPhoto.size < originalMatchPhotoSize,
          didCompressNextPhoto:
            compressedNextPhoto.size < originalNextPhotoSize
        }
      })
    } finally {
      isCompressingPhotos.value = false
    }
  }

  const handleSubmit = async () => {
    const submitStartedAt = Date.now()

    void trackSubmitEvent({
      eventName: 'submit_clicked',
      step: 'submit',
      metadata: getSubmitDiagnosticMetadata()
    })

    if (isSubmitting.value) {
      void trackSubmitEvent({
        eventName: 'submit_ignored',
        step: 'submit',
        message: 'Submit ignored because a submission is already in progress.',
        metadata: {
          ...getSubmitDiagnosticMetadata(),
          submitDurationMs: Date.now() - submitStartedAt
        }
      })

      return
    }

    submitError.value = ''
    submitWarning.value = ''
    submitStatusMessage.value = 'Checking your submission details…'

    if (!validateForm()) {
      isReviewing.value = false
      submitStatusMessage.value = ''

      void trackSubmitEvent({
        eventName: 'submit_validation_failed',
        step: 'submit',
        metadata: {
          ...getSubmitDiagnosticMetadata(),
          submitDurationMs: Date.now() - submitStartedAt
        }
      })

      await scrollToFirstErrorField()

      return
    }

    if (!form.matchPhoto || !form.nextPhoto) {
      isReviewing.value = false
      submitStatusMessage.value = ''

      void trackSubmitEvent({
        eventName: 'submit_validation_failed',
        step: 'submit',
        message: 'Submission was missing one or more photos.',
        metadata: {
          ...getSubmitDiagnosticMetadata(),
          submitDurationMs: Date.now() - submitStartedAt
        }
      })

      return
    }

    isSubmitting.value = true
    submitStatusMessage.value =
      'Preparing your photos. Keep this page open while we submit your tag…'

    void trackSubmitEvent({
      eventName: 'submit_started',
      step: 'submit',
      metadata: getSubmitDiagnosticMetadata()
    })

    try {
      await compressSubmitPhotos()

      const submitFormData = createSubmitFormData()

      submitStatusMessage.value =
        'Uploading your photos and sending your submission for review…'

      void trackSubmitEvent({
        eventName: 'submit_api_started',
        step: 'api',
        metadata: getSubmitDiagnosticMetadata()
      })

      const submitResult = await submitTag(submitFormData)

      submitStatusMessage.value =
        'Submission received. Taking you to the confirmation page…'

      void trackSubmitEvent({
        eventName: 'submit_api_succeeded',
        step: 'api',
        metadata: {
          ...getSubmitDiagnosticMetadata(),
          submissionId: submitResult.submissionId ?? null,
          submitDurationMs: Date.now() - submitStartedAt
        }
      })

      clearSubmitTagDraft()
      shouldPersistDraft.value = false
      resetForm()
      clearErrors()

      isNavigatingAfterSuccessfulSubmit.value = true

      void trackSubmitEvent({
        eventName: 'submit_navigation_started',
        step: 'success-navigation',
        metadata: {
          ...getSubmitDiagnosticMetadata(),
          submissionId: submitResult.submissionId ?? null,
          submitDurationMs: Date.now() - submitStartedAt
        }
      })

      await navigateTo({
        path: '/submit/success',
        query: submitResult.submissionId
          ? {
              reference: submitResult.submissionId
            }
          : undefined
      })
    } catch (error) {
      isNavigatingAfterSuccessfulSubmit.value = false

      const originalErrorMessage = getSubmitErrorMessage(error)
      const previousSubmitStatusMessage = submitStatusMessage.value

      submitError.value =
        'Your submission could not be completed. Your form details are still here — please try again.'

      void trackSubmitEvent({
        eventName: 'submit_failed',
        step: 'submit',
        message: submitError.value,
        metadata: {
          ...getSubmitDiagnosticMetadata(),
          submitDurationMs: Date.now() - submitStartedAt,
          previousSubmitStatusMessage,
          originalErrorMessage,
          errorName: error instanceof Error ? error.name : null,
          errorMessage: error instanceof Error ? error.message : null,
          errorStatusCode:
            typeof error === 'object' &&
            error !== null &&
            'statusCode' in error &&
            typeof error.statusCode === 'number'
              ? error.statusCode
              : null,
          errorStatusMessage:
            typeof error === 'object' &&
            error !== null &&
            'statusMessage' in error &&
            typeof error.statusMessage === 'string'
              ? error.statusMessage
              : null,
          errorData:
            typeof error === 'object' && error !== null && 'data' in error
              ? error.data
              : null
        }
      })

      submitStatusMessage.value = ''

      console.error(error)
    } finally {
      isSubmitting.value = false
    }
  }

  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (!hasUnsavedChanges.value && !isSubmitting.value) {
      return
    }

    event.preventDefault()
    event.returnValue = ''
  }

  watch(
    submitTagDraft,
    (draft) => {
      if (!shouldPersistDraft.value) {
        return
      }

      if (!hasDraftContent.value) {
        clearSubmitTagDraft()

        return
      }

      saveSubmitTagDraft(draft)
    },
    { deep: true }
  )

  onMounted(() => {
    const savedDraft = loadSubmitTagDraft()

    if (savedDraft) {
      restoreDraft(savedDraft)
      isDraftRestored.value = true
    }

    shouldPersistDraft.value = true

    window.addEventListener('beforeunload', handleBeforeUnload)

    void trackSubmitEvent({
      eventName: 'submit_page_loaded',
      step: 'page',
      metadata: getSubmitDiagnosticMetadata()
    })
  })

  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
    clearImagePreviews()
  })

  onBeforeRouteLeave(() => {
    if (isNavigatingAfterSuccessfulSubmit.value) {
      return true
    }

    if (isSubmitting.value) {
      return window.confirm(
        'Your submission is still uploading. Are you sure you want to leave this page?'
      )
    }

    if (!hasUnsavedChanges.value) {
      return true
    }

    return window.confirm(
      'You have unsaved changes. Are you sure you want to leave this page?'
    )
  })

  return {
    form,
    errors,
    formElement,
    isReviewing,
    isSubmitting,
    isCompressingPhotos,
    isCapturingFoundLocation,
    isCapturingNextHiddenLocation,
    isDraftRestored,
    submitError,
    submitWarning,
    submitStatusMessage,
    matchPhotoPreviewUrl,
    nextPhotoPreviewUrl,
    hasUnsavedChanges,
    hasCapturedFoundLocation,
    hasCapturedNextHiddenLocation,
    foundLocationDisplay,
    nextHiddenLocationDisplay,
    isFormReady,
    firstErrorField,
    validationSummary,
    matchPhotoName,
    nextPhotoName,
    clearFieldError,
    clearSubmitFeedback,
    clearSavedDraft,
    clearCapturedFoundLocation,
    clearCapturedNextHiddenLocation,
    clearFoundCapturedMetadataForManualLink,
    clearNextHiddenCapturedMetadataForManualLink,
    captureFoundLocation,
    captureNextHiddenLocation,
    handleMatchPhotoChange,
    handleNextPhotoChange,
    handleReview,
    handleEdit,
    handleSubmit
  }
}