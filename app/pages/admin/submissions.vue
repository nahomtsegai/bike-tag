<template>
  <main class="admin-page">
    <section class="admin-hero">
      <p class="eyebrow">Admin Review</p>
      <h1>Submission Review</h1>
      <p class="hero-copy">
        Review pending, approved, and rejected Bike Tag submissions.
      </p>
    </section>

    <section
      v-if="!hasValidatedAdminAccess"
      class="admin-card"
    >
      <div class="section-header">
        <div>
          <p class="eyebrow">Access</p>
          <h2>Admin token</h2>
        </div>
      </div>

      <label class="field">
        <span>Admin token</span>
        <input
          v-model="adminToken"
          type="password"
          autocomplete="off"
          placeholder="Paste admin token"
        >
      </label>

      <div class="button-row">
        <button
          class="primary-button"
          type="button"
          :disabled="!canSaveAdminToken"
          @click="void saveAdminToken()"
        >
          Save token locally
        </button>

        <button
          class="secondary-button"
          type="button"
          @click="clearAdminToken"
        >
          Clear token
        </button>
      </div>

      <p class="helper-text">
        The token is stored in this browser only. Server routes still enforce admin access.
      </p>
    </section>

    <section
      v-else
      class="admin-access-bar"
    >
      <div>
        <p class="eyebrow">Access</p>
        <p class="access-status">Admin access active</p>
      </div>

      <button
        class="secondary-button"
        type="button"
        @click="clearAdminToken"
      >
        Clear token
      </button>
    </section>

    <section
      v-if="hasValidatedAdminAccess"
      ref="reviewerSectionElement"
      class="admin-card"
    >
      <div class="section-header">
        <div>
          <p class="eyebrow">Reviewer</p>
          <h2>Reviewer name</h2>
        </div>
      </div>

      <label class="field">
        <span>Reviewer name</span>
        <input
          ref="reviewerNameInputElement"
          v-model="reviewerName"
          type="text"
          autocomplete="name"
          placeholder="Reviewer name"
        >
      </label>

      <p class="helper-text">
        This name is stored with approval and rejection actions.
      </p>
    </section>

    <section
      v-if="hasValidatedAdminAccess"
      class="admin-card"
    >
      <div class="section-header">
        <div>
          <p class="eyebrow">Filters</p>
          <h2>Find submissions</h2>
        </div>
      </div>

      <div class="filters-grid">
        <label class="field">
          <span>Status</span>
          <select v-model="selectedStatus">
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>

        <label class="field">
          <span>Search</span>
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Search rider, title, clue, or reason"
          >
        </label>

        <label class="field">
          <span>Limit</span>
          <select v-model.number="limit">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </label>
      </div>

      <div class="button-row">
        <button
          class="primary-button"
          type="button"
          :disabled="isLoading"
          @click="void applyFilters()"
        >
          Apply filters
        </button>

        <button
          class="secondary-button"
          type="button"
          :disabled="isLoading || offset === 0"
          @click="void goToPreviousPage()"
        >
          Previous
        </button>

        <button
          class="secondary-button"
          type="button"
          :disabled="isLoading || !pagination.hasMore"
          @click="void goToNextPage()"
        >
          Next
        </button>
      </div>

      <p
        v-if="errorMessage"
        class="error-message"
      >
        {{ errorMessage }}
      </p>

      <p
        v-if="successMessage"
        class="success-message"
      >
        {{ successMessage }}
      </p>
    </section>

    <section
      v-else-if="errorMessage || successMessage"
      class="admin-card"
    >
      <p
        v-if="errorMessage"
        class="error-message"
      >
        {{ errorMessage }}
      </p>

      <p
        v-if="successMessage"
        class="success-message"
      >
        {{ successMessage }}
      </p>
    </section>

    <section
      v-if="hasValidatedAdminAccess"
      class="submissions-layout"
    >
      <div class="admin-card">
        <div class="section-header">
          <div>
            <p class="eyebrow">Results</p>
            <h2>Submissions</h2>
          </div>
        </div>

        <div class="summary-grid">
          <button
            class="summary-card summary-filter-card summary-card-pending"
            type="button"
            :class="{ selected: selectedStatus === 'pending' }"
            :disabled="isLoading"
            @click="void applySummaryStatusFilter('pending')"
          >
            <span>Pending</span>
            <strong>
              <span
                v-if="isLoading"
                class="summary-count-skeleton"
                aria-label="Loading pending count"
              />
              <span v-else>{{ summaryCounts.pending }}</span>
            </strong>
          </button>

          <button
            class="summary-card summary-filter-card summary-card-approved"
            type="button"
            :class="{ selected: selectedStatus === 'approved' }"
            :disabled="isLoading"
            @click="void applySummaryStatusFilter('approved')"
          >
            <span>Approved</span>
            <strong>
              <span
                v-if="isLoading"
                class="summary-count-skeleton"
                aria-label="Loading approved count"
              />
              <span v-else>{{ summaryCounts.approved }}</span>
            </strong>
          </button>

          <button
            class="summary-card summary-filter-card summary-card-rejected"
            type="button"
            :class="{ selected: selectedStatus === 'rejected' }"
            :disabled="isLoading"
            @click="void applySummaryStatusFilter('rejected')"
          >
            <span>Rejected</span>
            <strong>
              <span
                v-if="isLoading"
                class="summary-count-skeleton"
                aria-label="Loading rejected count"
              />
              <span v-else>{{ summaryCounts.rejected }}</span>
            </strong>
          </button>
        </div>

        <p class="summary-helper">
          Counts show matching submissions for each status. Click a status card to filter submissions.
        </p>

        <AppStateMessage
          v-if="isLoading"
          variant="loading"
          message="Loading submissions..."
        />

        <AppStateMessage
          v-else-if="submissions.length === 0"
          variant="empty"
          eyebrow="No submissions"
          title="No submissions found."
          message="Try changing the status filter, or check back after someone submits a tag."
        />

        <ul
          v-else
          class="submission-list"
        >
          <li
            v-for="submission in submissions"
            :key="submission.id"
          >
            <button
              class="submission-button"
              type="button"
              :class="{ selected: selectedSubmission?.id === submission.id }"
              @click="selectSubmission(submission)"
            >
              <span class="submission-title">
                {{ submission.nextTitle }}
              </span>

              <span class="submission-meta-row">
                <span class="submission-meta">
                  {{ submission.riderName }}
                </span>

                <span
                  class="status-pill"
                  :class="getStatusBadgeClass(submission.status)"
                >
                  {{ formatStatus(submission.status) }}
                </span>
              </span>

              <span class="submission-date">
                {{ formatAdminDate(submission.createdAt) }}
              </span>
            </button>
          </li>
        </ul>

        <div class="pagination-summary">
          <span>Limit: {{ pagination.limit }}</span>
          <span>Offset: {{ pagination.offset }}</span>
          <span>More: {{ pagination.hasMore ? 'Yes' : 'No' }}</span>
        </div>
      </div>

      <aside class="admin-card detail-card">
        <div class="section-header">
          <div>
            <p class="eyebrow">Details</p>
            <h2>Selected submission</h2>
          </div>
        </div>

        <AppStateMessage
          v-if="!selectedSubmission"
          variant="empty"
          eyebrow="No submission selected"
          title="Select a submission to review."
          message="Choose a submission from the list to view photos, map links, review status, and moderation actions."
        />

        <div
          v-else
          class="detail-stack"
        >
          <AppStateMessage
            v-if="isLoadingSelectedSubmission"
            variant="loading"
            message="Refreshing selected submission details..."
          />

          <div class="status-row">
            <span
              class="status-pill"
              :class="getStatusBadgeClass(selectedSubmission.status)"
            >
              {{ formatStatus(selectedSubmission.status) }}
            </span>
            <span class="submission-date">
              {{ formatAdminDate(selectedSubmission.createdAt) }}
            </span>
          </div>

          <dl class="detail-list">
            <div>
              <dt>Submission ID</dt>
              <dd>{{ selectedSubmission.id }}</dd>
            </div>

            <div>
              <dt>Active tag ID</dt>
              <dd>{{ selectedSubmission.activeTagId }}</dd>
            </div>

            <div>
              <dt>Rider</dt>
              <dd>{{ selectedSubmission.riderName }}</dd>
            </div>

            <div>
              <dt>Next title</dt>
              <dd>{{ selectedSubmission.nextTitle }}</dd>
            </div>

            <div>
              <dt>Next clue</dt>
              <dd>{{ selectedSubmission.nextClue }}</dd>
            </div>

            <div>
              <dt>Rejection reason</dt>
              <dd>{{ selectedSubmission.rejectionReason || 'None' }}</dd>
            </div>

            <div>
              <dt>Reviewed by</dt>
              <dd>{{ selectedSubmission.reviewedBy || 'Not reviewed' }}</dd>
            </div>

            <div>
              <dt>Reviewed at</dt>
              <dd>{{ formatAdminDate(selectedSubmission.reviewedAt) }}</dd>
            </div>
          </dl>

          <div class="image-preview-grid">
            <figure class="image-preview-card">
              <a
                v-if="!imageHasFailed(selectedSubmission.id, 'matchPhoto')"
                :href="selectedSubmission.matchPhotoUrl"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open match photo in a new tab"
              >
                <img
                  :src="selectedSubmission.matchPhotoUrl"
                  alt="Submitted match photo"
                  loading="lazy"
                  @error="handleImageError(selectedSubmission.id, 'matchPhoto')"
                >
              </a>

              <div
                v-else
                class="image-fallback"
              >
                <p>Image could not be loaded.</p>
                <p>Use the link below to open the photo.</p>
              </div>

              <figcaption>Match photo</figcaption>
            </figure>

            <figure class="image-preview-card">
              <a
                v-if="!imageHasFailed(selectedSubmission.id, 'nextTagPhoto')"
                :href="selectedSubmission.nextTagPhotoUrl"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open next tag photo in a new tab"
              >
                <img
                  :src="selectedSubmission.nextTagPhotoUrl"
                  alt="Submitted next tag photo"
                  loading="lazy"
                  @error="handleImageError(selectedSubmission.id, 'nextTagPhoto')"
                >
              </a>

              <div
                v-else
                class="image-fallback"
              >
                <p>Image could not be loaded.</p>
                <p>Use the link below to open the photo.</p>
              </div>

              <figcaption>Next tag photo</figcaption>
            </figure>
          </div>

          <div class="link-grid">
            <a
              :href="selectedSubmission.foundLocationMapUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              Found location
            </a>

            <a
              :href="selectedSubmission.nextHiddenLocationMapUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              Hidden next location
            </a>

            <a
              :href="selectedSubmission.matchPhotoUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              Match photo
            </a>

            <a
              :href="selectedSubmission.nextTagPhotoUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              Next tag photo
            </a>
          </div>

          <div
            v-if="selectedSubmission.status === 'pending'"
            class="review-actions"
          >
            <div class="section-header compact-header">
              <div>
                <p class="eyebrow">Review</p>
                <h3>Take action</h3>
              </div>
            </div>

            <label class="field">
              <span>Rejection reason</span>
              <textarea
                v-model="rejectionReason"
                placeholder="Optional reason for rejecting this submission"
                rows="4"
              />
            </label>

            <div class="button-row">
              <button
                ref="approveSubmissionButtonElement"
                class="primary-button"
                type="button"
                :disabled="isReviewing"
                @click="openApproveConfirmation"
              >
                Approve submission
              </button>

              <button
                ref="rejectSubmissionButtonElement"
                class="danger-button"
                type="button"
                :disabled="isReviewing"
                @click="openRejectConfirmation"
              >
                Reject submission
              </button>
            </div>
          </div>
        </div>
      </aside>
    </section>

    <div
      v-if="reviewActionToConfirm && selectedSubmission"
      class="modal-backdrop"
      role="presentation"
      @click.self="closeReviewConfirmation"
    >
      <section
        ref="reviewModalElement"
        class="review-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reviewModalTitle"
        tabindex="-1"
      >
        <div class="section-header">
          <div>
            <p class="eyebrow">Confirm review</p>
            <h2 id="reviewModalTitle">
              {{ reviewConfirmationState.title }}
            </h2>
          </div>
        </div>

        <p class="modal-copy">
          {{ reviewConfirmationState.description }}
        </p>

        <dl class="modal-detail-list">
          <div>
            <dt>Submission</dt>
            <dd>{{ selectedSubmission.nextTitle }}</dd>
          </div>

          <div>
            <dt>Rider</dt>
            <dd>{{ selectedSubmission.riderName }}</dd>
          </div>

          <div>
            <dt>Reviewer</dt>
            <dd>{{ reviewerNamePendingReview }}</dd>
          </div>
        </dl>

        <div class="button-row modal-actions">
          <button
            class="secondary-button"
            type="button"
            :disabled="isReviewing"
            @click="closeReviewConfirmation"
          >
            Cancel
          </button>

          <button
            :class="reviewActionToConfirm === 'approve' ? 'primary-button' : 'danger-button'"
            type="button"
            :disabled="isReviewing"
            @click="void confirmReviewAction()"
          >
            {{ reviewConfirmationState.buttonLabel }}
          </button>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import type {
  AdminSubmission,
  AdminSubmissionSummary
} from '~/types/adminSubmissions'
import type { ReviewActionToConfirm } from '~/utils/adminReview'
import {
  lockBodyScroll as lockDocumentBodyScroll,
  unlockBodyScroll as unlockDocumentBodyScroll
} from '~/utils/bodyScroll'
import { getAdminApiErrorMessage } from '~/utils/adminApiErrors'
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
  getImageErrorKey,
  getStatusBadgeClass,
  type AdminImageType,
  type AdminSubmissionStatus
} from '~/utils/adminSubmissions'
import {
  clearSavedAdminToken,
  getSavedAdminToken,
  normalizeAdminToken,
  saveAdminTokenToStorage
} from '~/utils/adminTokenStorage'
import { restoreModalTriggerFocus } from '~/utils/modalFocus'

const adminToken = ref('')
const reviewerName = ref('')
const reviewerNamePendingReview = ref('')
const reviewerSectionElement = ref<HTMLElement | null>(null)
const reviewerNameInputElement = ref<HTMLInputElement | null>(null)
const approveSubmissionButtonElement = ref<HTMLButtonElement | null>(null)
const rejectSubmissionButtonElement = ref<HTMLButtonElement | null>(null)
const reviewModalTriggerElement = ref<HTMLElement | null>(null)
const hasValidatedAdminAccess = ref(false)
const selectedStatus = ref<AdminSubmissionStatus | ''>('pending')
const searchQuery = ref('')
const limit = ref(25)
const offset = ref(0)
const isLoading = ref(false)
const isLoadingSelectedSubmission = ref(false)
const isReviewing = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
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

const pagination = ref({
  limit: 25,
  offset: 0,
  count: 0,
  hasMore: false
})

const hasAdminToken = computed(() => {
  return Boolean(adminToken.value.trim())
})

const canSaveAdminToken = computed(() => {
  return hasAdminToken.value && !isLoading.value
})

const reviewConfirmationState = computed(() => {
  return getReviewConfirmationState({
    reviewActionToConfirm: reviewActionToConfirm.value
  })
})

const getAuthorizationHeaders = () => {
  return {
    Authorization: `Bearer ${normalizeAdminToken(adminToken.value)}`
  }
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
  pagination.value = {
    limit: limit.value,
    offset: offset.value,
    count: 0,
    hasMore: false
  }
}

const clearSavedAdminTokenAfterAuthFailure = () => {
  if (import.meta.client) {
    clearSavedAdminToken(localStorage)
  }

  adminToken.value = ''
  resetAdminData()
}

const getSubmissionAdminApiErrorMessage = (error: unknown) => {
  return getAdminApiErrorMessage(error, {
    onAuthFailure: clearSavedAdminTokenAfterAuthFailure
  })
}

const saveAdminToken = async () => {
  if (!import.meta.client) {
    return
  }

  if (!hasAdminToken.value) {
    errorMessage.value = 'Admin token is required.'
    successMessage.value = ''
    resetAdminData()
    return
  }

  saveAdminTokenToStorage(localStorage, adminToken.value)

  const didLoadSubmissions = await loadSubmissions()

  if (didLoadSubmissions) {
    successMessage.value = ''
    errorMessage.value = ''
  }
}

const clearAdminToken = () => {
  if (import.meta.client) {
    clearSavedAdminToken(localStorage)
  }

  adminToken.value = ''
  resetAdminData()
  successMessage.value = ''
  errorMessage.value = ''
}

const buildQueryParams = () => {
  return buildAdminSubmissionsQueryParams({
    selectedStatus: selectedStatus.value,
    searchQuery: searchQuery.value,
    limit: limit.value,
    offset: offset.value
  })
}

const loadSubmissions = async () => {
  if (!hasAdminToken.value) {
    errorMessage.value = 'Admin token is required.'
    successMessage.value = ''
    resetAdminData()
    return false
  }

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const queryParams = buildQueryParams()

    const response = await getAdminSubmissions({
      queryParams,
      headers: getAuthorizationHeaders()
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

const loadSelectedSubmissionDetail = async (submissionId: string) => {
  isLoadingSelectedSubmission.value = true
  errorMessage.value = ''

  try {
    const response = await getAdminSubmissionDetail({
      submissionId,
      headers: getAuthorizationHeaders()
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

const applySummaryStatusFilter = async (status: AdminSubmissionStatus) => {
  selectedStatus.value = status
  offset.value = 0
  await loadSubmissions()
}

const goToPreviousPage = async () => {
  offset.value = Math.max(0, offset.value - limit.value)
  await loadSubmissions()
}

const goToNextPage = async () => {
  offset.value += limit.value
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
  return failedImageKeys.value.has(getImageErrorKey(submissionId, imageType))
}

const handleImageError = (submissionId: string, imageType: AdminImageType) => {
  failedImageKeys.value = new Set([
    ...failedImageKeys.value,
    getImageErrorKey(submissionId, imageType)
  ])
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
      headers: getAuthorizationHeaders(),
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
      headers: getAuthorizationHeaders(),
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

  const savedToken = getSavedAdminToken(localStorage)

  if (savedToken) {
    adminToken.value = savedToken
    void loadSubmissions()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleReviewModalKeydown)
  unlockBodyScroll()
})
</script>

<style scoped>
.admin-page {
  display: grid;
  gap: 1.5rem;
  margin: 0 auto;
  max-width: 76rem;
  padding: 2rem;
}

.admin-hero {
  background:
    radial-gradient(circle at top left, rgba(20, 184, 166, 0.16), transparent 26rem),
    linear-gradient(135deg, rgba(248, 250, 252, 0.98), rgba(241, 245, 249, 0.9));
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 2rem;
  padding: 2rem;
}

.admin-hero h1 {
  color: #0f172a;
  font-size: clamp(2.5rem, 8vw, 5rem);
  line-height: 0.95;
  margin: 0;
}

.hero-copy {
  color: #475569;
  font-size: 1.125rem;
  margin: 1rem 0 0;
  max-width: 42rem;
}

.admin-card,
.admin-access-bar {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 1.5rem;
  box-shadow: 0 1rem 3rem rgba(15, 23, 42, 0.08);
  padding: 1.25rem;
}

.admin-access-bar {
  align-items: center;
  background: rgba(236, 253, 245, 0.9);
  border-color: rgba(16, 185, 129, 0.24);
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}

.access-status {
  color: #065f46;
  font-weight: 900;
  margin: 0.25rem 0 0;
}

.section-header {
  align-items: center;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.section-header h2 {
  color: #0f172a;
  font-size: 1.5rem;
  margin: 0.25rem 0 0;
}

.eyebrow {
  color: #0f766e;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  margin: 0;
  text-transform: uppercase;
}

.field {
  display: grid;
  gap: 0.45rem;
}

.field span {
  color: #334155;
  font-size: 0.9rem;
  font-weight: 700;
}

input,
select,
textarea {
  background: #fff;
  border: 1px solid rgba(100, 116, 139, 0.38);
  border-radius: 999px;
  color: #0f172a;
  font: inherit;
  padding: 0.85rem 1rem;
  width: 100%;
}

textarea {
  border-radius: 1rem;
  min-height: 7rem;
  resize: vertical;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #0f766e;
  outline: 3px solid rgba(20, 184, 166, 0.18);
}

.filters-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(10rem, 14rem) 1fr minmax(8rem, 10rem);
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1rem;
}

.primary-button,
.secondary-button,
.danger-button {
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  font: inherit;
  font-weight: 800;
  padding: 0.85rem 1.15rem;
}

.primary-button {
  background: #0f172a;
  color: #fff;
}

.secondary-button {
  background: #e2e8f0;
  color: #0f172a;
}

.danger-button {
  background: #991b1b;
  color: #fff;
}

.primary-button:disabled,
.secondary-button:disabled,
.danger-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.helper-text {
  color: #64748b;
  margin: 1rem 0 0;
}

.error-message,
.success-message {
  border-radius: 1rem;
  font-weight: 700;
  margin: 1rem 0 0;
  padding: 1rem;
}

.error-message {
  background: #fef2f2;
  color: #991b1b;
}

.success-message {
  background: #ecfdf5;
  color: #065f46;
}

.submissions-layout {
  align-items: start;
  display: grid;
  gap: 1.5rem;
  grid-template-columns: minmax(0, 1fr) minmax(22rem, 0.8fr);
}

.summary-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(3, minmax(8.5rem, 1fr));
}

.summary-card {
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.32);
  border-radius: 1rem;
  display: grid;
  font: inherit;
  gap: 0.35rem;
  padding: 1rem;
  text-align: left;
}

.summary-filter-card {
  cursor: pointer;
}

.summary-filter-card:hover,
.summary-filter-card:focus {
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.12);
  outline: none;
}

.summary-filter-card.selected {
  border-color: #0f766e;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.18);
}

.summary-filter-card:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.summary-card span {
  color: #64748b;
  font-size: clamp(0.72rem, 1.4vw, 0.8rem);
  font-weight: 800;
  letter-spacing: 0.06em;
  line-height: 1.15;
  overflow-wrap: anywhere;
  text-transform: uppercase;
}

.summary-card strong {
  color: #0f172a;
  font-size: 1.75rem;
  line-height: 1;
}

.summary-count-skeleton {
  animation: skeletonPulse 1.2s ease-in-out infinite;
  background: rgba(100, 116, 139, 0.24);
  border-radius: 999px;
  display: block;
  height: 1.75rem;
  width: 3rem;
}

.summary-card-pending {
  background: #fffbeb;
  border-color: rgba(245, 158, 11, 0.28);
}

.summary-card-approved {
  background: #ecfdf5;
  border-color: rgba(16, 185, 129, 0.28);
}

.summary-card-rejected {
  background: #fef2f2;
  border-color: rgba(239, 68, 68, 0.28);
}

.summary-helper {
  color: #64748b;
  font-size: 0.9rem;
  margin: 0.75rem 0 1rem;
}

.status-pill {
  border: 1px solid rgba(100, 116, 139, 0.26);
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 800;
  padding: 0.4rem 0.75rem;
  width: fit-content;
}

.status-pill-pending {
  background: #fffbeb;
  border-color: rgba(245, 158, 11, 0.3);
  color: #92400e;
}

.status-pill-approved {
  background: #ecfdf5;
  border-color: rgba(16, 185, 129, 0.3);
  color: #065f46;
}

.status-pill-rejected {
  background: #fef2f2;
  border-color: rgba(239, 68, 68, 0.3);
  color: #991b1b;
}

.submission-list {
  display: grid;
  gap: 0.75rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.submission-button {
  background: #fff;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 1rem;
  cursor: pointer;
  display: grid;
  gap: 0.5rem;
  padding: 1rem;
  text-align: left;
  width: 100%;
}

.submission-button:hover,
.submission-button.selected {
  border-color: #0f766e;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.12);
}

.submission-title {
  color: #0f172a;
  font-size: 1rem;
  font-weight: 900;
}

.submission-meta-row {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.submission-meta,
.submission-date {
  color: #64748b;
  font-size: 0.9rem;
}

.pagination-summary {
  color: #64748b;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1rem;
}

.detail-card {
  position: sticky;
  top: 1rem;
}

.detail-stack {
  display: grid;
  gap: 1rem;
}

.status-row {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.detail-list {
  display: grid;
  gap: 0.9rem;
  margin: 0;
}

.detail-list div {
  border-bottom: 1px solid rgba(148, 163, 184, 0.25);
  padding-bottom: 0.9rem;
}

.detail-list dt {
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.detail-list dd {
  color: #0f172a;
  margin: 0.25rem 0 0;
  overflow-wrap: anywhere;
}

.image-preview-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.image-preview-card {
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 1rem;
  display: grid;
  gap: 0.75rem;
  margin: 0;
  overflow: hidden;
  padding: 0.75rem;
}

.image-preview-card a {
  border-radius: 0.75rem;
  display: block;
  overflow: hidden;
}

.image-preview-card a:focus {
  outline: 3px solid rgba(20, 184, 166, 0.28);
  outline-offset: 3px;
}

.image-preview-card a:hover img {
  transform: scale(1.02);
}

.image-preview-card img {
  aspect-ratio: 4 / 3;
  border-radius: 0.75rem;
  object-fit: cover;
  transition: transform 160ms ease;
  width: 100%;
}

.image-preview-card figcaption {
  color: #334155;
  font-size: 0.9rem;
  font-weight: 800;
}

.image-fallback {
  align-content: center;
  aspect-ratio: 4 / 3;
  background: #f1f5f9;
  border: 1px dashed rgba(100, 116, 139, 0.42);
  border-radius: 0.75rem;
  color: #475569;
  display: grid;
  justify-items: center;
  padding: 1rem;
  text-align: center;
}

.image-fallback p {
  margin: 0;
}

.image-fallback p:first-child {
  color: #0f172a;
  font-weight: 900;
}

.link-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.link-grid a {
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 999px;
  color: #0f766e;
  font-weight: 800;
  padding: 0.8rem 1rem;
  text-align: center;
  text-decoration: none;
}

.link-grid a:hover {
  background: #ecfeff;
}

.review-actions {
  border-top: 1px solid rgba(148, 163, 184, 0.25);
  display: grid;
  gap: 1rem;
  padding-top: 1rem;
}

.compact-header {
  margin-bottom: 0;
}

.compact-header h3 {
  color: #0f172a;
  font-size: 1.15rem;
  margin: 0.25rem 0 0;
}

.modal-backdrop {
  align-items: center;
  background: rgba(15, 23, 42, 0.52);
  display: flex;
  inset: 0;
  justify-content: center;
  padding: 1rem;
  position: fixed;
  z-index: 50;
}

.review-modal {
  background: #fff;
  border-radius: 1.5rem;
  box-shadow: 0 2rem 5rem rgba(15, 23, 42, 0.28);
  max-width: 34rem;
  padding: 1.25rem;
  width: 100%;
}

.review-modal:focus {
  outline: 3px solid rgba(20, 184, 166, 0.28);
  outline-offset: 3px;
}

.modal-copy {
  color: #475569;
  line-height: 1.6;
  margin: 0 0 1rem;
}

.modal-detail-list {
  display: grid;
  gap: 0.75rem;
  margin: 0;
}

.modal-detail-list div {
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 1rem;
  padding: 0.85rem;
}

.modal-detail-list dt {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.modal-detail-list dd {
  color: #0f172a;
  font-weight: 800;
  margin: 0.25rem 0 0;
  overflow-wrap: anywhere;
}

.modal-actions {
  justify-content: flex-end;
}

@keyframes skeletonPulse {
  0%,
  100% {
    opacity: 0.45;
  }

  50% {
    opacity: 1;
  }
}

@media (max-width: 980px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .admin-page {
    padding: 1rem;
  }

  .admin-access-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .filters-grid,
  .submissions-layout {
    grid-template-columns: 1fr;
  }

  .detail-card {
    position: static;
  }

  .image-preview-grid,
  .link-grid {
    grid-template-columns: 1fr;
  }

  .modal-actions {
    display: grid;
  }
}

@media (max-width: 520px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>