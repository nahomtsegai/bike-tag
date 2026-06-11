<template>
    <AppStateMessage v-if="isLoading" variant="loading" message="Loading submissions..." />

    <div v-else-if="submissions.length === 0" class="empty-submissions-state">
        <AppStateMessage variant="empty" :eyebrow="emptySubmissionsState.eyebrow" :title="emptySubmissionsState.title"
            :message="emptySubmissionsState.message" />

        <div class="empty-submissions-actions">
            <button v-if="hasActiveSubmissionFilters" class="secondary-button" type="button" :disabled="isLoading"
                @click="$emit('clear-filters')">
                Clear filters
            </button>

            <NuxtLink v-else to="/submit" class="secondary-button">
                View submit page
            </NuxtLink>
        </div>
    </div>

    <ul v-else class="submission-list">
        <li v-for="submission in submissions" :key="submission.id">
            <button class="submission-button" type="button"
                :class="{ selected: selectedSubmissionId === submission.id }"
                @click="$emit('select-submission', submission)">
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

                    <span class="status-pill" :class="getStatusBadgeClass(submission.status)">
                        {{ formatStatus(submission.status) }}
                    </span>

                    <span v-if="submission.archivedAt" class="status-pill archived-status-pill">
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
    gap: 1rem;
}

.empty-submissions-actions {
    display: flex;
    justify-content: center;
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
    border: 1px solid rgba(148, 163, 184, 0.28);
    border-radius: 1rem;
    cursor: pointer;
    display: grid;
    gap: 0.45rem;
    padding: 1rem;
    text-align: left;
    width: 100%;
}

.submission-button:hover,
.submission-button.selected {
    border-color: rgba(15, 118, 110, 0.45);
    box-shadow: 0 0.85rem 2rem rgba(15, 23, 42, 0.08);
}

.submission-button.selected {
    background: rgba(240, 253, 250, 0.9);
}

.submission-title {
    color: #0f172a;
    font-weight: 800;
}

.submission-preview {
    color: #64748b;
    font-size: 0.92rem;
    line-height: 1.5;
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
    font-size: 0.85rem;
}

.status-pill {
    border-radius: 999px;
    display: inline-flex;
    font-size: 0.75rem;
    font-weight: 800;
    padding: 0.25rem 0.55rem;
}

.archived-status-pill {
    background: #f1f5f9;
    color: #475569;
}

.pagination-summary {
    color: #64748b;
    display: flex;
    flex-wrap: wrap;
    font-size: 0.85rem;
    gap: 0.75rem;
    margin-top: 1rem;
}

.secondary-button {
    align-items: center;
    background: #e2e8f0;
    border: 0;
    border-radius: 999px;
    color: #0f172a;
    cursor: pointer;
    display: inline-flex;
    font: inherit;
    font-weight: 800;
    justify-content: center;
    padding: 0.85rem 1.15rem;
    text-decoration: none;
}

.secondary-button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
}

@media (max-width: 860px) {
    .secondary-button {
        min-height: 3rem;
        width: 100%;
    }
}
</style>