import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref
} from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { isValidMapUrl } from '../utils/mapLinks'
import { useBikeTags } from './useBikeTags'

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

const maxImageFileSizeInBytes = 8 * 1024 * 1024
const maxImageFileSizeLabel = '8 MB'

const isImageFile = (file: File) => {
  return file.type.startsWith('image/')
}

const isFileTooLarge = (file: File) => {
  return file.size > maxImageFileSizeInBytes
}

export const useSubmitTagForm = () => {
  const { submitTag } = useBikeTags()

  const formElement = ref<HTMLFormElement | null>(null)
  const successMessageElement = ref<HTMLElement | null>(null)
  const isSubmitSuccessful = ref(false)
  const isReviewing = ref(false)
  const submitError = ref('')
  const submitWarning = ref('')

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
  }

  const clearSubmitFeedback = () => {
    isSubmitSuccessful.value = false
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

  const convertFileToDataUrl = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = () => {
        const image = new Image()

        image.onload = () => {
          const maxWidth = 800
          const scale = Math.min(1, maxWidth / image.width)
          const canvas = document.createElement('canvas')

          canvas.width = Math.round(image.width * scale)
          canvas.height = Math.round(image.height * scale)

          const context = canvas.getContext('2d')

          if (!context) {
            reject(new Error('Could not prepare image for saving.'))
            return
          }

          context.drawImage(image, 0, 0, canvas.width, canvas.height)

          resolve(canvas.toDataURL('image/jpeg', 0.55))
        }

        image.onerror = () => {
          reject(new Error('Could not read selected image.'))
        }

        image.src = String(reader.result)
      }

      reader.onerror = () => {
        reject(reader.error)
      }

      reader.readAsDataURL(file)
    })
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

    if (!isImageFile(file)) {
      return invalidTypeMessage
    }

    if (isFileTooLarge(file)) {
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

    if (!isImageFile(selectedFile)) {
      errors.matchPhoto = 'Choose an image file for the matching tag photo.'
      input.value = ''
      return
    }

    if (isFileTooLarge(selectedFile)) {
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

    if (!isImageFile(selectedFile)) {
      errors.nextPhoto = 'Choose an image file for the next tag photo.'
      input.value = ''
      return
    }

    if (isFileTooLarge(selectedFile)) {
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
    isReviewing.value = false

    await nextTick()

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const handleSubmit = async () => {
    isSubmitSuccessful.value = false
    submitError.value = ''
    submitWarning.value = ''

    if (!validateForm()) {
      isReviewing.value = false
      return
    }

    if (!form.matchPhoto || !form.nextPhoto) {
      isReviewing.value = false
      return
    }

    try {
      const matchPhotoImageUrl = await convertFileToDataUrl(form.matchPhoto)
      const nextPhotoImageUrl = await convertFileToDataUrl(form.nextPhoto)

      const submitResult = submitTag({
        riderName: form.riderName,
        findLocationMapUrl: form.findLocationMapUrl,
        nextTitle: form.nextTitle,
        nextClue: form.nextClue,
        nextHiddenLocationMapUrl: form.nextHiddenLocationMapUrl,
        matchPhotoImageUrl,
        nextPhotoImageUrl
      })

      if (!submitResult.savedImages) {
        submitWarning.value =
          'Your tag was saved, but your phone did not have enough local storage for the photos. Image storage will be handled in a later phase.'
      }

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
      submitError.value =
        'Something went wrong while saving this tag locally. Try using smaller images or clearing local storage.'

      console.error(error)
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
    submitError,
    submitWarning,
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