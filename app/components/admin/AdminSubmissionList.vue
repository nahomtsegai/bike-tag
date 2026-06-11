<template>
  <AppStateMessage
    v-if="isLoading"
    variant="loading"
    message="Loading submissions..."
  />

  <div
    v-else-if="submissions.length === 0"
    class="empty-submissions-state"
  >
    <AppStateMessage
      variant="empty"
      :eyebrow="emptySubmissionsState.eyebrow"
      :title="emptySubmissionsState.title"
      :message="emptySubmissionsState.message"
    />

    <div class="empty-submissions-actions">
      <button
        v-if="hasActiveSubmissionFilters"
        class="secondary-button"
        type="button"
        :disabled="isLoading"
        @click="$emit('clear-filters')"
      >
        Clear filters
      </button>

      <NuxtLink v-else to="/submit" class="secondary-button">
        View submit page
      </NuxtLink>
    </div>
  </div>

  <ul v-else class="submission-list">
    <li v-for="submission in submissions" :key="submission.id">
      <button
        class="submission-button"
        type="button"
        :class="{ selected: selectedSubmissionId === submission.id }"
        @click="$emit('select-submission', submission)"
      >
        <span class="submission-title">
          {{ submission.nextTitle }}
        </span>

        <span class="submission-preview">
          {{ submission.nextClue }}
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

          <span
            v-if="submission.archivedAt"
            class="status-pill archived-status-pill"
          >
            Archived
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
</template>

<script setup lang="ts">
import type { AdminSubmission } from '~/types/adminSubmissions'

type AdminSubmissionStatus = AdminSubmission['status']

type EmptySubmissionsState = {
  eyebrow: string
  title: string
  message: string
}

type PaginationState = {
  limit: number
  offset: number
  hasMore: boolean
}

defineProps<{
  submissions: AdminSubmission[]
  selectedSubmissionId: string | null
  emptySubmissionsState: EmptySubmissionsState
  pagination: PaginationState
  isLoading: boolean
  hasActiveSubmissionFilters: boolean
  formatAdminDate: (value: string | null) => string
  formatStatus: (status: AdminSubmissionStatus) => string
  getStatusBadgeClass: (
    status: AdminSubmissionStatus
  ) => Record<string, boolean>
}>()

defineEmits<{
  'select-submission': [submission: AdminSubmission]
  'clear-filters': []
}>()
</script>

<style scoped>
.empty-submissions-state {
  display: grid;
  gap: 0.75rem;
}

.empty-submissions-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-left: 1.25rem;
}

.empty-submissions-actions .secondary-button {
  align-items: center;
  display: inline-flex;
  justify-content: center;
  text-align: center;
  text-decoration: none;
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

.submission-preview {
  color: #475569;
  display: -webkit-box;
  font-size: 0.9rem;
  line-height: 1.45;
  line-clamp: 2;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
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

@media (max-width: 860px) {
  .empty-submissions-actions {
    display: grid;
    margin-left: 0;
  }

  .empty-submissions-actions .secondary-button {
    width: 100%;
  }

  .submission-button {
    padding: 0.9rem;
  }

  .pagination-summary {
    background: #f8fafc;
    border: 1px solid rgba(148, 163, 184, 0.28);
    border-radius: 1rem;
    display: grid;
    gap: 0.35rem;
    padding: 0.85rem;
  }
}
</style>
