import type {
  AdminSubmission,
  AdminSubmissionSummary
} from '~/types/adminSubmissions'
import type { ReviewActionToConfirm } from '~/utils/adminReview'
import { getAdminApiErrorMessage } from '~/utils/adminApiErrors'
import { archiveAdminSubmission } from '~/utils/adminArchiveSubmissionApi'
import { deleteAdminSubmission } from '~/utils/adminDeleteSubmissionApi'
import { deleteAdminGameData } from '~/utils/adminDeleteGameDataApi'
import {
  addAdminImageError,
  hasAdminImageError
} from '~/utils/adminImageErrors'
import { createAdminOpeningTag } from '~/utils/adminOpeningTagApi'
import {
  createDefaultAdminPagination,
  getNextAdminPaginationOffset,
  getPreviousAdminPaginationOffset
} from '~/utils/adminPagination'
import { getValidatedReviewerName } from '~/utils/adminReviewer'
import { getReviewModalTriggerElement } from '~/utils/adminReviewActions'
import { getReviewConfirmationState } from '~/utils/adminReviewConfirmationState'
import {
  getFocusableElements,
  shouldCloseReviewModal,
  shouldSubmitReviewModal,
  shouldTrapReviewModalFocus,
  trapReviewModalFocus as trapReviewModalFocusWithinElement
} from '~/utils/adminReviewModal'
import {
  approveAdminSubmission,
  rejectAdminSubmission
} from '~/utils/adminReviewApi'
import { validateSelectedSubmissionForReviewState } from '~/utils/adminReviewState'
import { getAdminSubmissionDetail } from '~/utils/adminSubmissionDetailApi'
import { buildAdminSubmissionsQueryParams } from '~/utils/adminSubmissionQueries'
import { getAdminSubmissions } from '~/utils/adminSubmissionsApi'
import {
  formatAdminDate,
  formatStatus,
  getStatusBadgeClass,
  type AdminImageType,
  type AdminSubmissionStatus
} from '~/utils/adminSubmissions'
import {
  clearStoredAdminAccessToken,
  getAdminAuthHeaders,
  setStoredAdminAccessToken
} from '~/utils/adminTokenStorage'
import {
  lockBodyScroll as lockDocumentBodyScroll,
  unlockBodyScroll as unlockDocumentBodyScroll
} from '~/utils/bodyScroll'
import { restoreModalTriggerFocus } from '~/utils/modalFocus'

type AdminSessionResponse = {
  isAuthenticated: boolean
  authType?: 'session' | 'supabase' | null
  accessToken?: string
  expiresAt?: number
  adminUser?: {
    id: string
    email: string
    displayName: string | null
  } | null
}

export const useAdminSubmissions = () => {
  const adminEmail = ref('')
  const adminPassword = ref('')
  const reviewerName = ref('')
  const reviewerNamePendingReview = ref('')
  const reviewerSectionElement = ref<HTMLElement | null>(null)
  const reviewerNameInputElement = ref<HTMLInputElement | null>(null)
  const approveSubmissionButtonElement = ref<HTMLButtonElement | null>(null)
  const rejectSubmissionButtonElement = ref<HTMLButtonElement | null>(null)
  const reviewModalTriggerElement = ref<HTMLElement | null>(null)
  const hasValidatedAdminAccess = ref(false)
  const isCheckingAdminSession = ref(true)
  const selectedStatus = ref<AdminSubmissionStatus | ''>('pending')
  const searchQuery = ref('')
  const limit = ref(25)
  const offset = ref(0)
  const includeArchivedSubmissions = ref(false)
  const isLoading = ref(false)
  const isLoadingSelectedSubmission = ref(false)
  const isReviewing = ref(false)
  const isDeletingSubmission = ref(false)
  const isArchivingSubmission = ref(false)
  const isDeletingGameData = ref(false)
  const isCreatingOpeningTag = ref(false)
  const errorMessage = ref('')
  const successMessage = ref('')
  const deleteGameDataConfirmation = ref('')
  const openingTagTitle = ref('')
  const openingTagClue = ref('')
  const openingTagImageUrl = ref('')
  const openingTagHiddenLocationMapUrl = ref('')
  const rejectionReason = ref('')
  const submissions = ref<AdminSubmission[]>([])
  const selectedSubmission = ref<AdminSubmission | null>(null)
  const failedImageKeys = ref<Set<string>>(new Set())
  const reviewActionToConfirm = ref<ReviewActionToConfirm | null>(null)
  const reviewModalElement = ref<HTMLElement | null>(null)
  const previousBodyOverflow = ref<string | null>(null)
  const summaryCounts = ref<AdminSubmissionSummary>({
    pending: 0,
    approved: 0,
    rejected: 0
  })

  const deleteGameDataConfirmationText = 'DELETE GAME DATA'

  const pagination = ref(
    createDefaultAdminPagination({
      limit: 25,
      offset: 0
    })
  )

  const hasAdminEmail = computed(() => {
    return Boolean(adminEmail.value.trim())
  })

  const hasAdminPassword = computed(() => {
    return Boolean(adminPassword.value.trim())
  })

  const canSubmitAdminLogin = computed(() => {
    return hasAdminEmail.value && hasAdminPassword.value && !isLoading.value
  })

  const canDeleteGameData = computed(() => {
    return (
      deleteGameDataConfirmation.value.trim() ===
        deleteGameDataConfirmationText &&
      !isLoading.value &&
      !isReviewing.value &&
      !isDeletingSubmission.value &&
      !isArchivingSubmission.value &&
      !isDeletingGameData.value &&
      !isCreatingOpeningTag.value
    )
  })

  const isValidOpeningTagUrl = (value: string) => {
    try {
      const url = new URL(value.trim())

      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      return false
    }
  }

  const openingTagValidationMessage = computed(() => {
    if (!openingTagTitle.value.trim()) {
      return 'Opening tag title is required.'
    }

    if (!openingTagImageUrl.value.trim()) {
      return 'Opening tag photo URL is required.'
    }

    if (!isValidOpeningTagUrl(openingTagImageUrl.value)) {
      return 'Opening tag photo URL must start with http:// or https://.'
    }

    if (!openingTagClue.value.trim()) {
      return 'Opening tag clue is required.'
    }

    if (!openingTagHiddenLocationMapUrl.value.trim()) {
      return 'Hidden location map URL is required.'
    }

    if (!isValidOpeningTagUrl(openingTagHiddenLocationMapUrl.value)) {
      return 'Hidden location map URL must start with http:// or https://.'
    }

    return ''
  })

  const canCreateOpeningTag = computed(() => {
    return (
      !openingTagValidationMessage.value &&
      !isLoading.value &&
      !isReviewing.value &&
      !isDeletingSubmission.value &&
      !isArchivingSubmission.value &&
      !isDeletingGameData.value &&
      !isCreatingOpeningTag.value
    )
  })

  const createOpeningTagButtonLabel = computed(() => {
    if (isCreatingOpeningTag.value) {
      return 'Creating opening tag...'
    }

    if (!canCreateOpeningTag.value) {
      return 'Complete required fields'
    }

    return 'Create opening tag'
  })

  const reviewConfirmationState = computed(() => {
    return getReviewConfirmationState({
      reviewActionToConfirm: reviewActionToConfirm.value
    })
  })

  const totalSummaryCount = computed(() => {
    return (
      summaryCounts.value.pending +
      summaryCounts.value.approved +
      summaryCounts.value.rejected
    )
  })

  const normalizedSubmissionSearchQuery = computed(() => {
    return searchQuery.value.trim()
  })

  const hasActiveSubmissionFilters = computed(() => {
    return Boolean(
      selectedStatus.value ||
      normalizedSubmissionSearchQuery.value ||
      includeArchivedSubmissions.value
    )
  })

  const emptySubmissionsState = computed(() => {
    if (hasActiveSubmissionFilters.value) {
      return {
        eyebrow: 'No matching submissions',
        title: 'No submissions matched your filters.',
        message:
          'Try clearing the status, search, or archive filters to see more submissions.'
      }
    }

    return {
      eyebrow: 'No submissions',
      title: 'No submissions yet.',
      message:
        'Player submissions will appear here once someone submits a tag for review.'
    }
  })

  const formatCoordinate = (coordinate: number | null) => {
    if (coordinate === null) {
      return 'Not captured'
    }

    return coordinate.toFixed(6)
  }

  const formatLocationAccuracy = (accuracyMeters: number | null) => {
    if (accuracyMeters === null) {
      return 'Not available'
    }

    return `${Math.round(accuracyMeters)} meters`
  }

  const formatLocationCapturedAt = (capturedAt: string | null) => {
    if (!capturedAt) {
      return 'Not captured'
    }

    return formatAdminDate(capturedAt)
  }

  const logInToAdminSession = ({
    email,
    password
  }: {
    email: string
    password: string
  }) => {
    return $fetch<AdminSessionResponse>('/api/admin/session/login', {
      method: 'POST',
      body: {
        email: email.trim(),
        password
      }
    })
  }

  const logOutOfAdminSession = () => {
    return $fetch<AdminSessionResponse>('/api/admin/session/logout', {
      method: 'POST'
    })
  }

  const getAdminSession = () => {
    return $fetch<AdminSessionResponse>('/api/admin/session', {
      headers: getAdminAuthHeaders()
    })
  }

  const resetSummaryCounts = () => {
    summaryCounts.value = {
      pending: 0,
      approved: 0,
      rejected: 0
    }
  }

  const resetAdminData = () => {
    hasValidatedAdminAccess.value = false
    submissions.value = []
    selectedSubmission.value = null
    isLoadingSelectedSubmission.value = false
    resetSummaryCounts()
    closeReviewConfirmation()
    pagination.value = createDefaultAdminPagination({
      limit: limit.value,
      offset: offset.value
    })
  }

  const clearAdminSessionAfterAuthFailure = () => {
    adminPassword.value = ''
    resetAdminData()
  }

  const getSubmissionAdminApiErrorMessage = (error: unknown) => {
    return getAdminApiErrorMessage(error, {
      onAuthFailure: clearAdminSessionAfterAuthFailure
    })
  }

  const buildQueryParams = () => {
    return buildAdminSubmissionsQueryParams({
      selectedStatus: selectedStatus.value,
      searchQuery: searchQuery.value,
      limit: limit.value,
      offset: offset.value,
      includeArchived: includeArchivedSubmissions.value
    })
  }

  const loadSubmissions = async () => {
    isLoading.value = true
    errorMessage.value = ''
    successMessage.value = ''

    try {
      const queryParams = buildQueryParams()

      const response = await getAdminSubmissions({
        queryParams
      })

      submissions.value = response.submissions
      summaryCounts.value = response.summary
      pagination.value = response.pagination
      hasValidatedAdminAccess.value = true

      if (
        selectedSubmission.value &&
        !response.submissions.some((submission) => {
          return submission.id === selectedSubmission.value?.id
        })
      ) {
        selectedSubmission.value = null
        closeReviewConfirmation()
      }

      return true
    } catch (error) {
      errorMessage.value = getSubmissionAdminApiErrorMessage(error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const submitAdminLogin = async () => {
    if (!hasAdminEmail.value || !hasAdminPassword.value) {
      errorMessage.value = 'Admin email and password are required.'
      successMessage.value = ''
      resetAdminData()
      return
    }

    isLoading.value = true
    errorMessage.value = ''
    successMessage.value = ''

    try {
      const loginResponse = await logInToAdminSession({
        email: adminEmail.value,
        password: adminPassword.value
      })

      if (loginResponse.authType !== 'supabase' || !loginResponse.accessToken) {
        throw new Error('Invalid admin email or password.')
      }

      setStoredAdminAccessToken(loginResponse.accessToken)

      adminPassword.value = ''

      const didLoadSubmissions = await loadSubmissions()

      if (didLoadSubmissions) {
        successMessage.value = ''
        errorMessage.value = ''
      }
    } catch {
      clearStoredAdminAccessToken()
      resetAdminData()

      errorMessage.value = 'Invalid admin email or password.'
      successMessage.value = ''
    } finally {
      isLoading.value = false
    }
  }

  const signOutOfAdminSession = async () => {
    try {
      await logOutOfAdminSession()
    } catch {
      // Continue clearing local page state even if logout fails.
    }

    clearStoredAdminAccessToken()
    adminEmail.value = ''
    adminPassword.value = ''
    resetAdminData()
    successMessage.value = ''
    errorMessage.value = ''
  }

  const loadSelectedSubmissionDetail = async (submissionId: string) => {
    isLoadingSelectedSubmission.value = true
    errorMessage.value = ''

    try {
      const response = await getAdminSubmissionDetail({
        submissionId
      })

      if (selectedSubmission.value?.id === submissionId) {
        selectedSubmission.value = response.submission
      }
    } catch (error) {
      errorMessage.value = getSubmissionAdminApiErrorMessage(error)
    } finally {
      isLoadingSelectedSubmission.value = false
    }
  }

  const applyFilters = async () => {
    offset.value = 0
    await loadSubmissions()
  }

  const clearSubmissionFilters = async () => {
    selectedStatus.value = ''
    searchQuery.value = ''
    includeArchivedSubmissions.value = false
    offset.value = 0

    await loadSubmissions()
  }

  const applyAllStatusFilter = async () => {
    selectedStatus.value = ''
    offset.value = 0
    await loadSubmissions()
  }

  const applySummaryStatusFilter = async (status: AdminSubmissionStatus) => {
    selectedStatus.value = status
    offset.value = 0
    await loadSubmissions()
  }

  const goToPreviousPage = async () => {
    offset.value = getPreviousAdminPaginationOffset({
      currentOffset: offset.value,
      limit: limit.value
    })

    await loadSubmissions()
  }

  const goToNextPage = async () => {
    offset.value = getNextAdminPaginationOffset({
      currentOffset: offset.value,
      limit: limit.value
    })

    await loadSubmissions()
  }

  const selectSubmission = (submission: AdminSubmission) => {
    selectedSubmission.value = submission
    rejectionReason.value = ''
    closeReviewConfirmation()
    void loadSelectedSubmissionDetail(submission.id)
  }

  const refreshAfterReviewAction = async (submissionId: string) => {
    await loadSubmissions()

    const updatedSubmission = submissions.value.find((submission) => {
      return submission.id === submissionId
    })

    if (!updatedSubmission) {
      selectedSubmission.value = null
      return
    }

    selectedSubmission.value = updatedSubmission
    await loadSelectedSubmissionDetail(updatedSubmission.id)
  }

  const imageHasFailed = (submissionId: string, imageType: AdminImageType) => {
    return hasAdminImageError({
      failedImageKeys: failedImageKeys.value,
      submissionId,
      imageType
    })
  }

  const handleImageError = (
    submissionId: string,
    imageType: AdminImageType
  ) => {
    failedImageKeys.value = addAdminImageError({
      failedImageKeys: failedImageKeys.value,
      submissionId,
      imageType
    })
  }

  const focusReviewerNameField = async () => {
    await nextTick()

    reviewerSectionElement.value?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    })

    reviewerNameInputElement.value?.focus()
  }

  const getReviewerNameForReview = () => {
    try {
      return getValidatedReviewerName(reviewerName.value)
    } catch (error) {
      void focusReviewerNameField()
      throw error
    }
  }

  const validateSelectedSubmissionForReview = () => {
    const reviewStateValidation = validateSelectedSubmissionForReviewState({
      selectedSubmission: selectedSubmission.value
    })

    if (!reviewStateValidation.isValid) {
      errorMessage.value = reviewStateValidation.errorMessage
      successMessage.value = ''
      return false
    }

    return true
  }

  const restoreReviewModalTriggerFocus = async (
    triggerElement: HTMLElement | null
  ) => {
    await nextTick()

    restoreModalTriggerFocus({
      triggerElement,
      isClient: import.meta.client,
      containsElement: (element) => {
        return document.contains(element)
      }
    })
  }

  const closeReviewConfirmation = () => {
    const triggerElement = reviewModalTriggerElement.value

    reviewActionToConfirm.value = null
    reviewerNamePendingReview.value = ''
    reviewModalTriggerElement.value = null

    void restoreReviewModalTriggerFocus(triggerElement)
  }

  const openReviewConfirmation = (reviewAction: ReviewActionToConfirm) => {
    if (!validateSelectedSubmissionForReview()) {
      return
    }

    try {
      reviewerNamePendingReview.value = getReviewerNameForReview()
    } catch (error) {
      errorMessage.value = getSubmissionAdminApiErrorMessage(error)
      successMessage.value = ''
      return
    }

    reviewModalTriggerElement.value = getReviewModalTriggerElement({
      reviewAction,
      approveButtonElement: approveSubmissionButtonElement.value,
      rejectButtonElement: rejectSubmissionButtonElement.value
    })

    errorMessage.value = ''
    successMessage.value = ''
    reviewActionToConfirm.value = reviewAction
  }

  const openApproveConfirmation = () => {
    openReviewConfirmation('approve')
  }

  const openRejectConfirmation = () => {
    openReviewConfirmation('reject')
  }

  const approveSelectedSubmission = async () => {
    if (!selectedSubmission.value || !reviewerNamePendingReview.value) {
      return
    }

    isReviewing.value = true
    errorMessage.value = ''
    successMessage.value = ''

    try {
      const response = await approveAdminSubmission({
        submissionId: selectedSubmission.value.id,
        reviewedBy: reviewerNamePendingReview.value
      })

      await refreshAfterReviewAction(response.submissionId)
      successMessage.value = response.message
      closeReviewConfirmation()
    } catch (error) {
      errorMessage.value = getSubmissionAdminApiErrorMessage(error)
    } finally {
      isReviewing.value = false
    }
  }

  const rejectSelectedSubmission = async () => {
    if (!selectedSubmission.value || !reviewerNamePendingReview.value) {
      return
    }

    isReviewing.value = true
    errorMessage.value = ''
    successMessage.value = ''

    try {
      const response = await rejectAdminSubmission({
        submissionId: selectedSubmission.value.id,
        reviewedBy: reviewerNamePendingReview.value,
        rejectionReason: rejectionReason.value.trim() || undefined
      })

      rejectionReason.value = ''
      await refreshAfterReviewAction(response.submissionId)
      successMessage.value = response.message
      closeReviewConfirmation()
    } catch (error) {
      errorMessage.value = getSubmissionAdminApiErrorMessage(error)
    } finally {
      isReviewing.value = false
    }
  }

  const deleteSelectedSubmission = async () => {
    if (!selectedSubmission.value) {
      return
    }

    if (
      selectedSubmission.value.status !== 'pending' &&
      selectedSubmission.value.status !== 'rejected'
    ) {
      errorMessage.value =
        'Only pending or rejected submissions can be deleted.'
      successMessage.value = ''
      return
    }

    const confirmed = window.confirm(
      'Delete this submission? This removes the submission and its uploaded photos. This cannot be undone.'
    )

    if (!confirmed) {
      return
    }

    isDeletingSubmission.value = true
    errorMessage.value = ''
    successMessage.value = ''

    try {
      await deleteAdminSubmission({
        submissionId: selectedSubmission.value.id
      })

      rejectionReason.value = ''
      selectedSubmission.value = null
      closeReviewConfirmation()

      await loadSubmissions()

      successMessage.value = 'Submission deleted.'
    } catch (error) {
      errorMessage.value =
        error instanceof Error
          ? error.message
          : getSubmissionAdminApiErrorMessage(error)
    } finally {
      isDeletingSubmission.value = false
    }
  }

  const archiveSelectedSubmission = async () => {
    if (!selectedSubmission.value) {
      return
    }

    if (selectedSubmission.value.status !== 'approved') {
      errorMessage.value = 'Only approved submissions can be archived.'
      successMessage.value = ''
      return
    }

    if (selectedSubmission.value.archivedAt) {
      errorMessage.value = 'Submission is already archived.'
      successMessage.value = ''
      return
    }

    const confirmed = window.confirm(
      'Archive this approved submission? This hides it from the default admin list without deleting game history.'
    )

    if (!confirmed) {
      return
    }

    isArchivingSubmission.value = true
    errorMessage.value = ''
    successMessage.value = ''

    try {
      await archiveAdminSubmission({
        submissionId: selectedSubmission.value.id
      })

      selectedSubmission.value = null
      closeReviewConfirmation()

      await loadSubmissions()

      successMessage.value = 'Approved submission archived.'
    } catch (error) {
      errorMessage.value =
        error instanceof Error
          ? error.message
          : getSubmissionAdminApiErrorMessage(error)
    } finally {
      isArchivingSubmission.value = false
    }
  }

  const deleteAllGameData = async () => {
    if (!canDeleteGameData.value) {
      errorMessage.value = `Type ${deleteGameDataConfirmationText} to confirm.`
      successMessage.value = ''
      return
    }

    const confirmed = window.confirm(
      'Delete all game data? This permanently removes all tags, submissions, and uploaded photos from storage. This cannot be undone.'
    )

    if (!confirmed) {
      return
    }

    isDeletingGameData.value = true
    errorMessage.value = ''
    successMessage.value = ''

    try {
      const response = await deleteAdminGameData({
        confirmation: deleteGameDataConfirmation.value.trim()
      })

      deleteGameDataConfirmation.value = ''
      rejectionReason.value = ''
      selectedSubmission.value = null
      closeReviewConfirmation()
      failedImageKeys.value = new Set()

      await loadSubmissions()

      successMessage.value = `${response.message} Deleted ${response.deletedTagCount} tags and ${response.deletedSubmissionCount} submissions.`
    } catch (error) {
      errorMessage.value =
        error instanceof Error
          ? error.message
          : getSubmissionAdminApiErrorMessage(error)
    } finally {
      isDeletingGameData.value = false
    }
  }

  const clearOpeningTagForm = () => {
    openingTagTitle.value = ''
    openingTagClue.value = ''
    openingTagImageUrl.value = ''
    openingTagHiddenLocationMapUrl.value = ''
  }

  const createOpeningTag = async () => {
    if (!canCreateOpeningTag.value) {
      errorMessage.value = openingTagValidationMessage.value
      successMessage.value = ''
      return
    }

    isCreatingOpeningTag.value = true
    errorMessage.value = ''
    successMessage.value = ''

    try {
      const response = await createAdminOpeningTag({
        title: openingTagTitle.value.trim(),
        clue: openingTagClue.value.trim(),
        imageUrl: openingTagImageUrl.value.trim(),
        hiddenLocationMapUrl: openingTagHiddenLocationMapUrl.value.trim()
      })

      clearOpeningTagForm()
      successMessage.value = response.message
    } catch (error) {
      errorMessage.value =
        error instanceof Error
          ? error.message
          : getSubmissionAdminApiErrorMessage(error)
    } finally {
      isCreatingOpeningTag.value = false
    }
  }

  const confirmReviewAction = async () => {
    if (reviewActionToConfirm.value === 'approve') {
      await approveSelectedSubmission()
      return
    }

    if (reviewActionToConfirm.value === 'reject') {
      await rejectSelectedSubmission()
    }
  }

  const lockBodyScroll = () => {
    if (!import.meta.client) {
      return
    }

    const bodyScrollState = lockDocumentBodyScroll({
      bodyStyle: document.body.style,
      state: {
        previousOverflow: previousBodyOverflow.value
      }
    })

    previousBodyOverflow.value = bodyScrollState.previousOverflow
  }

  const unlockBodyScroll = () => {
    if (!import.meta.client) {
      return
    }

    const bodyScrollState = unlockDocumentBodyScroll({
      bodyStyle: document.body.style,
      state: {
        previousOverflow: previousBodyOverflow.value
      }
    })

    previousBodyOverflow.value = bodyScrollState.previousOverflow
  }

  const trapReviewModalFocus = (event: KeyboardEvent) => {
    trapReviewModalFocusWithinElement({
      event,
      modalElement: reviewModalElement.value,
      focusableElements: getFocusableElements(reviewModalElement.value),
      activeElement: document.activeElement
    })
  }

  const handleReviewModalKeydown = (event: KeyboardEvent) => {
    if (!reviewActionToConfirm.value || isReviewing.value) {
      return
    }

    if (shouldCloseReviewModal(event)) {
      event.preventDefault()
      closeReviewConfirmation()
      return
    }

    if (shouldTrapReviewModalFocus(event)) {
      trapReviewModalFocus(event)
      return
    }

    if (shouldSubmitReviewModal(event)) {
      event.preventDefault()
      void confirmReviewAction()
    }
  }

  const restoreAdminSession = async () => {
    isCheckingAdminSession.value = true

    try {
      const session = await getAdminSession()

      if (session.isAuthenticated) {
        await loadSubmissions()
        return
      }

      resetAdminData()
    } catch {
      resetAdminData()
    } finally {
      isCheckingAdminSession.value = false
    }
  }

  watch(reviewActionToConfirm, async (reviewAction) => {
    if (!reviewAction) {
      unlockBodyScroll()
      return
    }

    lockBodyScroll()

    await nextTick()
    reviewModalElement.value?.focus()
  })

  onMounted(() => {
    window.addEventListener('keydown', handleReviewModalKeydown)
    void restoreAdminSession()
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleReviewModalKeydown)
    unlockBodyScroll()
  })

  return {
    adminEmail,
    adminPassword,
    reviewerName,
    reviewerNamePendingReview,
    reviewerSectionElement,
    reviewerNameInputElement,
    approveSubmissionButtonElement,
    rejectSubmissionButtonElement,
    hasValidatedAdminAccess,
    isCheckingAdminSession,
    selectedStatus,
    searchQuery,
    limit,
    offset,
    includeArchivedSubmissions,
    isLoading,
    isLoadingSelectedSubmission,
    isReviewing,
    isDeletingSubmission,
    isArchivingSubmission,
    isDeletingGameData,
    isCreatingOpeningTag,
    errorMessage,
    successMessage,
    deleteGameDataConfirmation,
    deleteGameDataConfirmationText,
    openingTagTitle,
    openingTagClue,
    openingTagImageUrl,
    openingTagHiddenLocationMapUrl,
    rejectionReason,
    submissions,
    selectedSubmission,
    reviewActionToConfirm,
    reviewModalElement,
    summaryCounts,
    pagination,
    hasAdminEmail,
    hasAdminPassword,
    canSubmitAdminLogin,
    canDeleteGameData,
    openingTagValidationMessage,
    canCreateOpeningTag,
    createOpeningTagButtonLabel,
    reviewConfirmationState,
    totalSummaryCount,
    normalizedSubmissionSearchQuery,
    hasActiveSubmissionFilters,
    emptySubmissionsState,
    formatAdminDate,
    formatStatus,
    getStatusBadgeClass,
    formatCoordinate,
    formatLocationAccuracy,
    formatLocationCapturedAt,
    submitAdminLogin,
    signOutOfAdminSession,
    loadSubmissions,
    applyFilters,
    clearSubmissionFilters,
    applyAllStatusFilter,
    applySummaryStatusFilter,
    goToPreviousPage,
    goToNextPage,
    selectSubmission,
    imageHasFailed,
    handleImageError,
    openApproveConfirmation,
    openRejectConfirmation,
    closeReviewConfirmation,
    deleteSelectedSubmission,
    archiveSelectedSubmission,
    deleteAllGameData,
    createOpeningTag,
    confirmReviewAction
  }
}
