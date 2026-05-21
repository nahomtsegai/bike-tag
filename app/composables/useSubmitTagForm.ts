import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref
} from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import {
  isAllowedImageMimeType,
  isAllowedImageSize,
  maxImageFileSizeLabel
} from '../../shared/utils/imageValidation'
import { isValidMapUrl } from '../utils/mapLinks'
import { useTagApi } from './useTagApi'

type FormErrors = {
  riderName?: string
  findLocationMapUrl?: string
  matchPhoto?: string
  nextTitle?: string
  nextClue?: string
  nextHiddenLocationMapUrl?: string
  nextPhoto?: string
}

type ErrorField = keyof FormErrors

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

export const useSubmitTagForm = () => {
  const { submitTag } = useTagApi()

  const formElement = ref<HTMLFormElement | null>(null)
  const successMessageElement = ref<HTMLElement | null>(null)
  const isSubmitSuccessful = ref(false)
  const isReviewing = ref(false)
  const isSubmitting = ref(false)
  const submitError = ref('')
  const submitWarning = ref('')
  const submittedCurrentTagId = ref('')

  const matchPhotoPreviewUrl = ref<string | null>(null)
  const nextPhotoPreviewUrl = ref<string | null>(null)

  const form = reactive({
    riderName: '',
    findLocationMapUrl: '',
    matchPhoto: null as File | null,
    notes: '',
    nextTitle: '',
    nextClue: '',
    nextHiddenLocationMapUrl: '',
    nextPhoto: null as File | null
  })

  const errors = reactive<FormErrors>({})

  const createSubmitFormData = () => {
    const submitFormData = new FormData()

    submitFormData.append('riderName', form.riderName)
    submitFormData.append('foundLocationMapUrl', form.findLocationMapUrl)
    submitFormData.append('nextTitle', form.nextTitle)
    submitFormData.append('nextClue', form.nextClue)
    submitFormData.append(
      'nextHiddenLocationMapUrl',
      form.nextHiddenLocationMapUrl
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
        form.findLocationMapUrl.trim() ||
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
        form.findLocationMapUrl.trim() &&
        form.matchPhoto &&
        form.nextTitle.trim() &&
        form.nextClue.trim() &&
        form.nextHiddenLocationMapUrl.trim() &&
        form.nextPhoto
    )
  })

  const matchPhotoName = computed(() => {
    return form.matchPhoto?.name ?? 'No file selected'
  })

  const nextPhotoName = computed(() => {
    return form.nextPhoto?.name ?? 'No file selected'
  })

  const clearErrors = () => {
    errors.riderName = undefined
    errors.findLocationMapUrl = undefined
    errors.matchPhoto = undefined
    errors.nextTitle = undefined
    errors.nextClue = undefined
    errors.nextHiddenLocationMapUrl = undefined
    errors.nextPhoto = undefined
  }

  const clearFieldError = (fieldName: ErrorField) => {
    errors[fieldName] = undefined
    isSubmitSuccessful.value = false
    submitError.value = ''
    submitWarning.value = ''
    submittedCurrentTagId.value = ''
  }

  const clearSubmitFeedback = () => {
    isSubmitSuccessful.value = false
    submitError.value = ''
    submitWarning.value = ''
    submittedCurrentTagId.value = ''
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

  const validateImageFile = (
    file: File | null,
    emptyMessage: string,
    invalidTypeMessage: string,
    tooLargeMessage: string
  ) => {
    if (!file) {
      return emptyMessage
    }

    if (!isAllowedImageMimeType(file.type)) {
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

    if (!form.findLocationMapUrl.trim()) {
      errors.findLocationMapUrl =
        'Paste a Google Maps link for where you found the current tag.'
    } else if (!isValidMapUrl(form.findLocationMapUrl)) {
      errors.findLocationMapUrl =
        'Paste a Google Maps link that starts with https://www.google.com/maps, https://maps.google.com, or https://maps.app.goo.gl.'
    }

    const matchPhotoError = validateImageFile(
      form.matchPhoto,
      'Add a matching photo for the current tag.',
      'Choose an image file for the matching tag photo.',
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
        'Paste a Google Maps link for the hidden location.'
    } else if (!isValidMapUrl(form.nextHiddenLocationMapUrl)) {
      errors.nextHiddenLocationMapUrl =
        'Paste a Google Maps link that starts with https://www.google.com/maps, https://maps.google.com, or https://maps.app.goo.gl.'
    }

    const nextPhotoError = validateImageFile(
      form.nextPhoto,
      'Add a photo for the next tag.',
      'Choose an image file for the next tag photo.',
      `Choose a next tag photo smaller than ${maxImageFileSizeLabel}.`
    )

    if (nextPhotoError) {
      errors.nextPhoto = nextPhotoError
    }

    return !Object.values(errors).some(Boolean)
  }

  const resetForm = () => {
    form.riderName = ''
    form.findLocationMapUrl = ''
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

    if (!isAllowedImageMimeType(selectedFile.type)) {
      errors.matchPhoto = 'Choose an image file for the matching tag photo.'
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

    if (!isAllowedImageMimeType(selectedFile.type)) {
      errors.nextPhoto = 'Choose an image file for the next tag photo.'
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
    isSubmitSuccessful.value = false
    submitError.value = ''
    submitWarning.value = ''

    if (!validateForm()) {
      return
    }

    isReviewing.value = true

    await nextTick()

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const handleEdit = async () => {
    if (isSubmitting.value) {
      return
    }

    isReviewing.value = false

    await nextTick()

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const handleSubmit = async () => {
    if (isSubmitting.value) {
      return
    }

    isSubmitSuccessful.value = false
    submitError.value = ''
    submitWarning.value = ''
    submittedCurrentTagId.value = ''

    if (!validateForm()) {
      isReviewing.value = false
      return
    }

    if (!form.matchPhoto || !form.nextPhoto) {
      isReviewing.value = false
      return
    }

    isSubmitting.value = true

    try {
      const submitResult = await submitTag(createSubmitFormData())

      submittedCurrentTagId.value = submitResult.currentTag.id

      await refreshNuxtData([
        'current-tag-page',
        'found-tags-page',
        'found-tags-map'
      ])

      resetForm()
      clearErrors()

      await nextTick()

      isSubmitSuccessful.value = true

      await nextTick()

      successMessageElement.value?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
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
    successMessageElement,
    isSubmitSuccessful,
    isReviewing,
    isSubmitting,
    submitError,
    submitWarning,
    submittedCurrentTagId,
    matchPhotoPreviewUrl,
    nextPhotoPreviewUrl,
    hasUnsavedChanges,
    isFormReady,
    matchPhotoName,
    nextPhotoName,
    clearFieldError,
    clearSubmitFeedback,
    handleMatchPhotoChange,
    handleNextPhotoChange,
    handleReview,
    handleEdit,
    handleSubmit
  }
}