import { computed, onMounted, ref } from 'vue'

import type { PublicSubmissionStatusResponse } from '~~/shared/types/submissionStatus'

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const getLookupErrorMessage = (error: unknown) => {
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

  return 'Could not check that submission status. Try again in a moment.'
}

export const useSubmissionStatusLookup = () => {
  const referenceCode = ref('')
  const submissionStatus = ref<PublicSubmissionStatusResponse | null>(null)
  const lookupError = ref('')
  const isLoading = ref(false)

  const normalizedReferenceCode = computed(() => {
    return referenceCode.value.trim()
  })

  const canSubmitLookup = computed(() => {
    return Boolean(normalizedReferenceCode.value && !isLoading.value)
  })

  const statusLabel = computed(() => {
    if (!submissionStatus.value) {
      return ''
    }

    if (submissionStatus.value.status === 'approved') {
      return 'Approved'
    }

    if (submissionStatus.value.status === 'rejected') {
      return 'Rejected'
    }

    return 'Pending review'
  })

  const statusDescription = computed(() => {
    if (!submissionStatus.value) {
      return ''
    }

    if (submissionStatus.value.status === 'approved') {
      return 'Your submission was approved. Nice work.'
    }

    if (submissionStatus.value.status === 'rejected') {
      return 'Your submission was reviewed and rejected.'
    }

    return 'Your submission is still waiting for admin review.'
  })

  const formatDate = (dateValue: string | null) => {
    if (!dateValue) {
      return 'Not reviewed yet'
    }

    return new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(dateValue))
  }

  const clearLookupFeedback = () => {
    lookupError.value = ''
  }

  const checkSubmissionStatus = async () => {
    lookupError.value = ''
    submissionStatus.value = null

    if (!normalizedReferenceCode.value) {
      lookupError.value = 'Enter your submission reference code.'

      return
    }

    if (!uuidPattern.test(normalizedReferenceCode.value)) {
      lookupError.value = 'Enter a valid submission reference code.'

      return
    }

    isLoading.value = true

    try {
      submissionStatus.value =
        await $fetch<PublicSubmissionStatusResponse>(
          `/api/submissions/status/${normalizedReferenceCode.value}`
        )
    } catch (error) {
      lookupError.value = getLookupErrorMessage(error)
    } finally {
      isLoading.value = false
    }
  }

  onMounted(async () => {
    const route = useRoute()
    const reference = route.query.reference

    if (typeof reference !== 'string') {
      return
    }

    referenceCode.value = reference

    if (uuidPattern.test(reference)) {
      await checkSubmissionStatus()
    }
  })

  return {
    referenceCode,
    submissionStatus,
    lookupError,
    isLoading,
    canSubmitLookup,
    statusLabel,
    statusDescription,
    formatDate,
    clearLookupFeedback,
    checkSubmissionStatus
  }
}