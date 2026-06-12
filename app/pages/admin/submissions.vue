<template>
  <main class="admin-page">
    <section class="admin-hero">
      <p class="eyebrow">Admin Review</p>
      <h1>Submission Review</h1>
      <p class="hero-copy">
        Review pending, approved, and rejected Bike Tag submissions.
      </p>
    </section>

    <section v-if="isCheckingAdminSession" class="admin-card">
      <AppStateMessage variant="loading" message="Checking admin session..." />
    </section>

    <AdminLoginPanel v-else-if="!hasValidatedAdminAccess" v-model:admin-email="adminEmail"
      v-model:admin-password="adminPassword" :can-submit-admin-login="canSubmitAdminLogin"
      @submit="void submitAdminLogin()" @clear="void signOutOfAdminSession()" />

    <section v-else-if="hasValidatedAdminAccess" class="admin-access-bar">
      <div>
        <p class="eyebrow">Admin Session</p>
        <p class="access-status">Signed in</p>
      </div>

      <button class="secondary-button" type="button" @click="void signOutOfAdminSession()">
        Sign out
      </button>
    </section>

    <AdminNav v-if="hasValidatedAdminAccess" />

    <AdminReviewerPanel v-if="hasValidatedAdminAccess" v-model:reviewer-name="reviewerName"
      v-model:reviewer-section-element="reviewerSectionElement"
      v-model:reviewer-name-input-element="reviewerNameInputElement" />

    <AdminOpeningTagPanel v-if="hasValidatedAdminAccess" v-model:opening-tag-title="openingTagTitle"
      v-model:opening-tag-clue="openingTagClue" v-model:opening-tag-image-url="openingTagImageUrl"
      v-model:opening-tag-hidden-location-map-url="openingTagHiddenLocationMapUrl"
      :opening-tag-validation-message="openingTagValidationMessage" :can-create-opening-tag="canCreateOpeningTag"
      :create-opening-tag-button-label="createOpeningTagButtonLabel" :is-creating-opening-tag="isCreatingOpeningTag"
      @create="void createOpeningTag()" @clear="clearOpeningTagForm" />

    <AdminSubmissionFilters v-if="hasValidatedAdminAccess" v-model:selected-status="selectedStatus"
      v-model:search-query="searchQuery" v-model:limit="limit"
      v-model:include-archived-submissions="includeArchivedSubmissions" :is-loading="isLoading"
      :summary-counts="summaryCounts" :total-summary-count="totalSummaryCount"
      :has-active-submission-filters="hasActiveSubmissionFilters" @refresh="void loadSubmissions()"
      @apply-filters="applyFilters" @clear-filters="clearSubmissionFilters" @select-all-status="applyAllStatusFilter"
      @select-summary-status="applySummaryStatusFilter" />

    <section v-if="hasValidatedAdminAccess" class="admin-card danger-zone-card">
      <div class="section-header">
        <div>
          <p class="eyebrow danger-eyebrow">Danger zone</p>
          <h2>Delete game data</h2>
        </div>
      </div>

      <p class="helper-text">
        This permanently deletes all tags, submissions, and uploaded photos from
        storage. This cannot be undone.
      </p>

      <label class="field">
        <span>Type DELETE GAME DATA to confirm</span>
        <input v-model="deleteGameDataConfirmation" type="text" autocomplete="off" placeholder="DELETE GAME DATA">
      </label>

      <div class="button-row">
        <button class="danger-button" type="button" :disabled="!canDeleteGameData" @click="void deleteAllGameData()">
          {{
            isDeletingGameData
              ? 'Deleting game data...'
              : 'Delete all game data'
          }}
        </button>
      </div>
    </section>

    <section v-else-if="!isCheckingAdminSession && (errorMessage || successMessage)" class="admin-card">
      <p v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </p>

      <p v-if="successMessage" class="success-message">
        {{ successMessage }}
      </p>
    </section>

    <section v-if="hasValidatedAdminAccess" class="submissions-layout">
      <div class="admin-card">
        <div class="section-header">
          <div>
            <p class="eyebrow">Results</p>
            <h2>Submissions</h2>
          </div>
        </div>

        <div class="summary-grid">
          <button class="summary-card summary-filter-card summary-card-all" type="button"
            :class="{ selected: selectedStatus === '' }" :disabled="isLoading" @click="void applyAllStatusFilter()">
            <span>All</span>
            <strong>
              <span v-if="isLoading" class="summary-count-skeleton" aria-label="Loading all count" />
              <span v-else>{{ totalSummaryCount }}</span>
            </strong>
          </button>

          <button class="summary-card summary-filter-card summary-card-pending" type="button"
            :class="{ selected: selectedStatus === 'pending' }" :disabled="isLoading"
            @click="void applySummaryStatusFilter('pending')">
            <span>Pending</span>
            <strong>
              <span v-if="isLoading" class="summary-count-skeleton" aria-label="Loading pending count" />
              <span v-else>{{ summaryCounts.pending }}</span>
            </strong>
          </button>

          <button class="summary-card summary-filter-card summary-card-approved" type="button"
            :class="{ selected: selectedStatus === 'approved' }" :disabled="isLoading"
            @click="void applySummaryStatusFilter('approved')">
            <span>Approved</span>
            <strong>
              <span v-if="isLoading" class="summary-count-skeleton" aria-label="Loading approved count" />
              <span v-else>{{ summaryCounts.approved }}</span>
            </strong>
          </button>

          <button class="summary-card summary-filter-card summary-card-rejected" type="button"
            :class="{ selected: selectedStatus === 'rejected' }" :disabled="isLoading"
            @click="void applySummaryStatusFilter('rejected')">
            <span>Rejected</span>
            <strong>
              <span v-if="isLoading" class="summary-count-skeleton" aria-label="Loading rejected count" />
              <span v-else>{{ summaryCounts.rejected }}</span>
            </strong>
          </button>
        </div>

        <p class="summary-helper">
          Counts show matching submissions by status. Archived submissions are
          hidden unless the archive filter is enabled.
        </p>

        <AdminSubmissionList :submissions="submissions" :selected-submission-id="selectedSubmission?.id ?? null"
          :empty-submissions-state="emptySubmissionsState" :pagination="pagination" :is-loading="isLoading"
          :has-active-submission-filters="hasActiveSubmissionFilters" :format-admin-date="formatAdminDate"
          :format-status="formatStatus" :get-status-badge-class="getStatusBadgeClass"
          @select-submission="selectSubmission" @clear-filters="void clearSubmissionFilters()" />
      </div>

      <aside class="admin-card detail-card">
        <div class="section-header">
          <div>
            <p class="eyebrow">Details</p>
            <h2>Selected submission</h2>
          </div>
        </div>

        <AppStateMessage v-if="!selectedSubmission" variant="empty" eyebrow="No submission selected"
          title="Select a submission to review."
          message="Choose a submission from the list to view photos, map links, review status, and moderation actions." />

        <div v-else class="detail-stack">
          <AdminSubmissionDetail :submission="selectedSubmission"
            :is-loading-selected-submission="isLoadingSelectedSubmission" :format-admin-date="formatAdminDate"
            :format-status="formatStatus" :get-status-badge-class="getStatusBadgeClass"
            :format-coordinate="formatCoordinate" :format-location-accuracy="formatLocationAccuracy"
            :format-location-captured-at="formatLocationCapturedAt" :image-has-failed="imageHasFailed"
            :handle-image-error="handleImageError" />

          <AdminSubmissionReviewActions :submission="selectedSubmission" v-model:rejection-reason="rejectionReason"
            v-model:approve-submission-button-element="approveSubmissionButtonElement"
            v-model:reject-submission-button-element="rejectSubmissionButtonElement" :is-reviewing="isReviewing"
            :is-deleting-submission="isDeletingSubmission" :is-archiving-submission="isArchivingSubmission"
            @approve="openApproveConfirmation" @reject="openRejectConfirmation"
            @delete="void deleteSelectedSubmission()" @archive="void archiveSelectedSubmission()" />
        </div>
      </aside>
    </section>

    <AdminReviewConfirmationModal v-if="reviewActionToConfirm && selectedSubmission"
      v-model:review-modal-element="reviewModalElement" :submission="selectedSubmission"
      :review-action-to-confirm="reviewActionToConfirm" :review-confirmation-state="reviewConfirmationState"
      :reviewer-name-pending-review="reviewerNamePendingReview" :is-reviewing="isReviewing"
      @close="closeReviewConfirmation" @confirm="void confirmReviewAction()" />
  </main>
</template>

<script setup lang="ts">
import { useAdminSubmissions } from '~/composables/useAdminSubmissions'

const {
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
} = useAdminSubmissions()

const clearOpeningTagForm = () => {
  openingTagTitle.value = ''
  openingTagClue.value = ''
  openingTagImageUrl.value = ''
  openingTagHiddenLocationMapUrl.value = ''
}
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
    radial-gradient(circle at top left,
      rgba(20, 184, 166, 0.16),
      transparent 26rem),
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

.admin-access-bar {
  align-items: center;
  background: rgba(236, 253, 245, 0.9);
  border: 1px solid rgba(16, 185, 129, 0.24);
  border-radius: 1.5rem;
  box-shadow: 0 1rem 3rem rgba(15, 23, 42, 0.08);
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  padding: 1.25rem;
}

.access-status {
  color: #065f46;
  font-weight: 900;
  margin: 0.25rem 0 0;
}

.checkbox-field {
  align-items: center;
  color: #334155;
  display: flex;
  font-size: 0.95rem;
  font-weight: 800;
  gap: 0.6rem;
  margin-top: 1rem;
}

.checkbox-field input {
  accent-color: #0f766e;
  height: 1.1rem;
  width: 1.1rem;
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
  grid-template-columns: repeat(auto-fit, minmax(7.5rem, 1fr));
}

.summary-card {
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.32);
  border-radius: 1rem;
  display: grid;
  font: inherit;
  gap: 0.35rem;
  min-width: 0;
  padding: 1rem;
  text-align: left;
}

.summary-card-all {
  background: #f8fafc;
  border-color: rgba(100, 116, 139, 0.28);
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
  line-height: 1.45;
  margin: 0.85rem 0 1rem;
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
  flex-wrap: wrap;
  gap: 0.5rem;
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

.submission-review-summary {
  background:
    radial-gradient(circle at top right,
      rgba(20, 184, 166, 0.12),
      transparent 16rem),
    #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 1rem;
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.submission-review-summary-header {
  align-items: flex-start;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}

.submission-review-summary-header h3 {
  color: #0f172a;
  font-size: 1.25rem;
  font-weight: 800;
  line-height: 1.25;
  margin: 0.25rem 0 0;
  overflow-wrap: anywhere;
}

.compact-status-row {
  justify-content: flex-end;
}

.summary-detail-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
}

.summary-detail-grid div {
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 0.85rem;
  padding: 0.8rem;
}

.summary-detail-grid dt {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 750;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.summary-detail-grid dd {
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 650;
  line-height: 1.35;
  margin: 0.25rem 0 0;
  overflow-wrap: anywhere;
}

.review-warning {
  background: #fffbeb;
  border: 1px solid rgba(245, 158, 11, 0.32);
  border-radius: 1rem;
  color: #92400e;
  font-weight: 800;
  line-height: 1.55;
  margin: 0;
  padding: 0.95rem 1rem;
}

.captured-location-card {
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 1rem;
  display: grid;
  gap: 0.85rem;
  padding: 1rem;
}

.captured-location-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.captured-location-header h3 {
  color: #0f172a;
  font-size: 1.05rem;
  margin: 0.25rem 0 0;
}

.captured-location-copy {
  color: #475569;
  line-height: 1.55;
  margin: 0;
}

.captured-location-list {
  display: grid;
  gap: 0.75rem;
  margin: 0;
}

.captured-location-list div {
  border-bottom: 1px solid rgba(148, 163, 184, 0.25);
  display: grid;
  gap: 0.25rem;
  padding-bottom: 0.75rem;
}

.captured-location-list div:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.captured-location-list dt {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.captured-location-list dd {
  color: #0f172a;
  margin: 0;
  overflow-wrap: anywhere;
}

.captured-location-link {
  background: #ecfeff;
  border: 1px solid rgba(20, 184, 166, 0.28);
  border-radius: 999px;
  color: #0f766e;
  font-weight: 800;
  padding: 0.8rem 1rem;
  text-align: center;
  text-decoration: none;
}

.captured-location-link:hover {
  background: #ccfbf1;
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
  .submissions-layout {
    grid-template-columns: 1fr;
  }

  .detail-card {
    position: static;
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .admin-page {
    gap: 1rem;
    padding: 1rem;
  }

  .admin-hero {
    border-radius: 1.5rem;
    padding: 1.25rem;
  }

  .admin-hero h1 {
    font-size: clamp(2.25rem, 12vw, 3.5rem);
  }

  .hero-copy {
    font-size: 1rem;
  }

  .admin-access-bar {
    align-items: stretch;
    border-radius: 1.25rem;
    flex-direction: column;
    padding: 1rem;
  }

  .danger-zone-card {
    border-color: rgba(153, 27, 27, 0.28);
  }

  .danger-eyebrow {
    color: #991b1b;
  }

  .filters-grid {
    grid-template-columns: 1fr;
  }

  .status-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.5rem;
  }

  .detail-list div {
    padding-bottom: 0.75rem;
  }

  .image-preview-grid,
  .link-grid {
    grid-template-columns: 1fr;
  }

  .modal-backdrop {
    align-items: flex-end;
    padding: 0.75rem;
  }

  .review-modal {
    border-radius: 1.25rem;
    max-height: calc(100dvh - 1.5rem);
    overflow: auto;
    padding: 1rem;
  }

  .modal-actions {
    display: grid;
  }

  .submission-review-summary-header {
    display: grid;
  }

  .compact-status-row {
    justify-content: flex-start;
  }

  .summary-detail-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .summary-card {
    padding: 0.9rem;
  }

  .summary-card strong {
    font-size: 1.5rem;
  }

  input,
  select,
  textarea {
    font-size: 1rem;
  }

  .admin-page {
    padding: 0.75rem;
  }
}
</style>
