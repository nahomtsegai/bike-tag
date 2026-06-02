import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import {
  allowedImageFileTypesLabel,
  isAllowedImageMimeTypeAndExtension,
  isAllowedImageSize,
  maxImageFileSizeLabel
} from '~~/shared/utils/imageValidation'
import {
  getFirstSubmitTagErrorField,
  getSubmitTagValidationSummary,
  type SubmitTagErrorField,
  type SubmitTagFormErrors
} from '../utils/submitTagValidation'
import { useTagApi } from './useTagApi'

type CapturedLocation = {
  latitude: number
  longitude: number
  accuracyMeters: number
  capturedAt: string
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

const formatCapturedAt = (capturedAt: string) => {
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

  const formElement = ref<HTMLFormElement | null>(null)
  const isReviewing = ref(false)
  const isSubmitting = ref(false)
  const isCapturingFoundLocation = ref(false)
  const submitError = ref('')
  const submitWarning = ref('')
  const matchPhotoPreviewUrl = ref<string | null>(null)
  const nextPhotoPreviewUrl = ref<string | null>(null)

  const form = reactive({
    riderName: '',
    foundLocationMapUrl: '',
    foundLatitude: null as number | null,
    foundLongitude: null as number | null,
    foundLocationAccuracyMeters: null as number | null,
    foundLocationCapturedAt: '',
    matchPhoto: null as File | null,
    notes: '',
    nextTitle: '',
    nextClue: '',
    nextHiddenLocationMapUrl: '',
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

  const foundLocationDisplay = computed(() => {
    return {
      latitude: formatCoordinate(form.foundLatitude),
      longitude: formatCoordinate(form.foundLongitude),
      accuracy: formatAccuracy(form.foundLocationAccuracyMeters),
      capturedAt: formatCapturedAt(form.foundLocationCapturedAt)
    }
  })

  const createSubmitFormData = () => {
    const submitFormData = new FormData()

    submitFormData.append('riderName', form.riderName)
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

    submitFormData.append(
      'foundLocationCapturedAt',
      form.foundLocationCapturedAt
    )

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
        hasCapturedFoundLocation.value ||
        form.matchPhoto ||
        form.notes.trim() ||
        form.nextTitle.trim() ||
        form.nextClue.trim() ||
        form.nextHiddenLocationMapUrl.trim() ||
        form.nextPhoto
    )
  })

  const isFormReady = computed(() => {
    return Boolean(
      form.riderName.trim() &&
        hasCapturedFoundLocation.value &&
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

  const clearErrors = () => {
    errors.riderName = undefined
    errors.foundLocation = undefined
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
  }

  const clearSubmitFeedback = () => {
    submitError.value = ''
    submitWarning.value = ''
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
    form.foundLocationCapturedAt = ''
    errors.foundLocation = undefined
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
    errors.foundLocation = undefined
    clearSubmitFeedback()

    if (accuracyMeters > 100) {
      submitWarning.value =
        'Location captured, but accuracy is wider than 100 meters. Move outside or closer to the tag and try again if possible.'
    }
  }

  const captureFoundLocation = async () => {
    if (!import.meta.client) {
      return
    }

    if (!('geolocation' in navigator)) {
      errors.foundLocation =
        'Your browser does not support location capture. Try another browser or device.'

      return
    }

    isCapturingFoundLocation.value = true
    errors.foundLocation = undefined
    clearSubmitFeedback()

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 15000
          })
        }
      )

      setCapturedFoundLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracyMeters: position.coords.accuracy,
        capturedAt: new Date().toISOString()
      })
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        typeof error.code === 'number'
      ) {
        errors.foundLocation = getGeolocationErrorMessage(
          error as GeolocationPositionError
        )
      } else {
        errors.foundLocation = 'Could not capture your location. Try again near the tag.'
      }
    } finally {
      isCapturingFoundLocation.value = false
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

    if (!hasCapturedFoundLocation.value) {
      errors.foundLocation =
        'Capture your current location while you are near the found tag.'
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
        'Add the hidden map link for the next tag.'
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
    form.nextHiddenLocationMapUrl = ''
    form.nextPhoto = null
    isReviewing.value = false
    clearImagePreviews()
    formElement.value?.reset()
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

      return
    }

    if (!isAllowedImageSize(selectedFile.size)) {
      errors.matchPhoto = `Choose a matching tag photo smaller than ${maxImageFileSizeLabel}.`
      input.value = ''

      return
    }

    form.matchPhoto = selectedFile
    matchPhotoPreviewUrl.value = URL.createObjectURL(selectedFile)
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

      return
    }

    if (!isAllowedImageSize(selectedFile.size)) {
      errors.nextPhoto = `Choose a next tag photo smaller than ${maxImageFileSizeLabel}.`
      input.value = ''

      return
    }

    form.nextPhoto = selectedFile
    nextPhotoPreviewUrl.value = URL.createObjectURL(selectedFile)
  }

  const handleReview = async () => {
    submitError.value = ''
    submitWarning.value = ''

    if (!validateForm()) {
      await scrollToFirstErrorField()

      return
    }

    isReviewing.value = true

    await nextTick()

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleEdit = async () => {
    if (isSubmitting.value) {
      return
    }

    isReviewing.value = false

    await nextTick()

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async () => {
    if (isSubmitting.value) {
      return
    }

    submitError.value = ''
    submitWarning.value = ''

    if (!validateForm()) {
      isReviewing.value = false
      await scrollToFirstErrorField()

      return
    }

    if (!form.matchPhoto || !form.nextPhoto) {
      isReviewing.value = false

      return
    }

    isSubmitting.value = true

    try {
      await submitTag(createSubmitFormData())

      await refreshNuxtData([
        'current-tag-page',
        'found-tags-page',
        'found-tags-map'
      ])

      resetForm()
      clearErrors()

      await navigateTo('/submit/success')
    } catch (error) {
      submitError.value = getSubmitErrorMessage(error)

      console.error(error)
    } finally {
      isSubmitting.value = false
    }
  }

  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (!hasUnsavedChanges.value) {
      return
    }

    event.preventDefault()
    event.returnValue = ''
  }

  onMounted(() => {
    window.addEventListener('beforeunload', handleBeforeUnload)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
    clearImagePreviews()
  })

  onBeforeRouteLeave(() => {
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
    isCapturingFoundLocation,
    submitError,
    submitWarning,
    matchPhotoPreviewUrl,
    nextPhotoPreviewUrl,
    hasUnsavedChanges,
    hasCapturedFoundLocation,
    foundLocationDisplay,
    isFormReady,
    firstErrorField,
    validationSummary,
    matchPhotoName,
    nextPhotoName,
    clearFieldError,
    clearSubmitFeedback,
    clearCapturedFoundLocation,
    captureFoundLocation,
    handleMatchPhotoChange,
    handleNextPhotoChange,
    handleReview,
    handleEdit,
    handleSubmit
  }
}