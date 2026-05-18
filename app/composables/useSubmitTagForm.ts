import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref
} from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useBikeTags } from './useBikeTags'

type FormErrors = {
  riderName?: string
  findLocationName?: string
  matchPhoto?: string
  nextTitle?: string
  nextClue?: string
  nextHiddenLocationName?: string
  nextPhoto?: string
}

type ErrorField = keyof FormErrors

export const useSubmitTagForm = () => {
  const { submitTag } = useBikeTags()

  const formElement = ref<HTMLFormElement | null>(null)
  const successMessageElement = ref<HTMLElement | null>(null)
  const isSubmitSuccessful = ref(false)
  const submitError = ref('')
  const submitWarning = ref('')

  const matchPhotoPreviewUrl = ref<string | null>(null)
  const nextPhotoPreviewUrl = ref<string | null>(null)

  const form = reactive({
    riderName: '',
    findLocationName: '',
    matchPhoto: null as File | null,
    notes: '',
    nextTitle: '',
    nextClue: '',
    nextHiddenLocationName: '',
    nextPhoto: null as File | null
  })

  const errors = reactive<FormErrors>({})

  const hasUnsavedChanges = computed(() => {
    return Boolean(
      form.riderName.trim() ||
        form.findLocationName.trim() ||
        form.matchPhoto ||
        form.notes.trim() ||
        form.nextTitle.trim() ||
        form.nextClue.trim() ||
        form.nextHiddenLocationName.trim() ||
        form.nextPhoto
    )
  })

  const isFormReady = computed(() => {
    return Boolean(
      form.riderName.trim() &&
        form.findLocationName.trim() &&
        form.matchPhoto &&
        form.nextTitle.trim() &&
        form.nextClue.trim() &&
        form.nextHiddenLocationName.trim() &&
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
    errors.findLocationName = undefined
    errors.matchPhoto = undefined
    errors.nextTitle = undefined
    errors.nextClue = undefined
    errors.nextHiddenLocationName = undefined
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

  const validateForm = () => {
    clearErrors()

    if (!form.riderName.trim()) {
      errors.riderName = 'Enter your name.'
    }

    if (!form.findLocationName.trim()) {
      errors.findLocationName = 'Enter where you found the current tag.'
    }

    if (!form.matchPhoto) {
      errors.matchPhoto = 'Add a matching photo for the current tag.'
    }

    if (!form.nextTitle.trim()) {
      errors.nextTitle = 'Enter a title for the next tag.'
    }

    if (!form.nextClue.trim()) {
      errors.nextClue = 'Enter the clue that will unlock after 5 days.'
    }

    if (!form.nextHiddenLocationName.trim()) {
      errors.nextHiddenLocationName =
        'Enter the hidden location for the next tag.'
    }

    if (!form.nextPhoto) {
      errors.nextPhoto = 'Add a photo for the next tag.'
    }

    return !Object.values(errors).some(Boolean)
  }

  const resetForm = () => {
    form.riderName = ''
    form.findLocationName = ''
    form.matchPhoto = null
    form.notes = ''
    form.nextTitle = ''
    form.nextClue = ''
    form.nextHiddenLocationName = ''
    form.nextPhoto = null

    clearImagePreviews()
    formElement.value?.reset()
  }

  const handleMatchPhotoChange = (event: Event) => {
    const input = event.target as HTMLInputElement
    const selectedFile = input.files?.[0] ?? null

    clearPreviewUrl(matchPhotoPreviewUrl.value)

    form.matchPhoto = selectedFile
    matchPhotoPreviewUrl.value = selectedFile
      ? URL.createObjectURL(selectedFile)
      : null

    errors.matchPhoto = undefined
    clearSubmitFeedback()
  }

  const handleNextPhotoChange = (event: Event) => {
    const input = event.target as HTMLInputElement
    const selectedFile = input.files?.[0] ?? null

    clearPreviewUrl(nextPhotoPreviewUrl.value)

    form.nextPhoto = selectedFile
    nextPhotoPreviewUrl.value = selectedFile
      ? URL.createObjectURL(selectedFile)
      : null

    errors.nextPhoto = undefined
    clearSubmitFeedback()
  }

  const handleSubmit = async () => {
    isSubmitSuccessful.value = false
    submitError.value = ''
    submitWarning.value = ''

    if (!validateForm()) {
      return
    }

    if (!form.matchPhoto || !form.nextPhoto) {
      return
    }

    try {
      const matchPhotoImageUrl = await convertFileToDataUrl(form.matchPhoto)
      const nextPhotoImageUrl = await convertFileToDataUrl(form.nextPhoto)

      const submitResult = submitTag({
        riderName: form.riderName,
        findLocationName: form.findLocationName,
        nextTitle: form.nextTitle,
        nextClue: form.nextClue,
        nextHiddenLocationName: form.nextHiddenLocationName,
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
    handleSubmit
  }
}