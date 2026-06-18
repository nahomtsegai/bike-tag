<script setup lang="ts">
import type {
  AdminAuditAction,
  AdminAuditEvent,
  AdminAuditOutcome
} from '~/types/adminAuditEvents'
import {
  formatAdminAuditAction,
  formatAdminAuditOutcome,
  formatAdminAuditTarget,
  getAdminAuditDurationLabel,
  getAdminAuditOutcomeClass,
  getAdminAuditSubmissionLink,
  hasAdminAuditMetadata
} from '~/utils/adminAuditEvents'
import { getAdminAuditEvents } from '~/utils/adminAuditEventsApi'
import { formatAdminDate } from '~/utils/adminSubmissions'

const actionOptions: Array<{
  label: string
  value: AdminAuditAction | ''
}> = [
  { label: 'All actions', value: '' },
  { label: 'Admin login', value: 'admin.login' },
  { label: 'Submission approved', value: 'submission.approve' },
  { label: 'Submission rejected', value: 'submission.reject' },
  { label: 'Submission archived', value: 'submission.archive' },
  { label: 'Submission deleted', value: 'submission.delete' },
  { label: 'Opening tag created', value: 'tag.opening.create' },
  { label: 'Game data deleted', value: 'game_data.delete' }
]

const outcomeOptions: Array<{
  label: string
  value: AdminAuditOutcome | ''
}> = [
  { label: 'All outcomes', value: '' },
  { label: 'Started', value: 'started' },
  { label: 'Succeeded', value: 'succeeded' },
  { label: 'Failed', value: 'failed' }
]

const selectedAction = ref<AdminAuditAction | ''>('')
const selectedOutcome = ref<AdminAuditOutcome | ''>('')
const searchQuery = ref('')
const limit = ref(50)
const offset = ref(0)
const isLoading = ref(false)
const errorMessage = ref('')
const events = ref<AdminAuditEvent[]>([])
const expandedEventIds = ref<Set<string>>(new Set())
const pagination = ref({
  limit: 50,
  offset: 0,
  total: 0,
  hasMore: false
})

const hasEvents = computed(() => events.value.length > 0)
const hasActiveFilters = computed(() => {
  return Boolean(
    selectedAction.value ||
    selectedOutcome.value ||
    searchQuery.value.trim()
  )
})
const visibleRangeStart = computed(() => {
  return pagination.value.total === 0 ? 0 : pagination.value.offset + 1
})
const visibleRangeEnd = computed(() => {
  return pagination.value.offset + events.value.length
})

const loadAuditEvents = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await getAdminAuditEvents({
      action: selectedAction.value,
      outcome: selectedOutcome.value,
      search: searchQuery.value,
      limit: limit.value,
      offset: offset.value
    })

    events.value = response.events
    pagination.value = response.pagination
    expandedEventIds.value = new Set()
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Could not load admin activity.'
  } finally {
    isLoading.value = false
  }
}

const applyFilters = async () => {
  offset.value = 0
  await loadAuditEvents()
}

const clearFilters = async () => {
  selectedAction.value = ''
  selectedOutcome.value = ''
  searchQuery.value = ''
  offset.value = 0
  await loadAuditEvents()
}

const goToPreviousPage = async () => {
  offset.value = Math.max(0, offset.value - limit.value)
  await loadAuditEvents()
}

const goToNextPage = async () => {
  offset.value += limit.value
  await loadAuditEvents()
}

const isMetadataExpanded = (eventId: string) => {
  return expandedEventIds.value.has(eventId)
}

const toggleMetadata = (eventId: string) => {
  const nextExpandedEventIds = new Set(expandedEventIds.value)

  if (nextExpandedEventIds.has(eventId)) {
    nextExpandedEventIds.delete(eventId)
  } else {
    nextExpandedEventIds.add(eventId)
  }

  expandedEventIds.value = nextExpandedEventIds
}

const formatMetadata = (event: AdminAuditEvent) => {
  return JSON.stringify(event.metadata, null, 2)
}

onMounted(() => {
  void loadAuditEvents()
})
</script>

<template>
  <section class="activity-stack">
    <section class="admin-card filter-card">
      <div class="section-header">
        <div>
          <p class="eyebrow">Filters</p>
          <h2>Find admin activity</h2>
        </div>

        <button
          class="secondary-button"
          type="button"
          :disabled="isLoading"
          @click="void loadAuditEvents()"
        >
          Refresh
        </button>
      </div>

      <form class="filter-grid" @submit.prevent="void applyFilters()">
        <label class="field">
          <span>Action</span>
          <select v-model="selectedAction" :disabled="isLoading">
            <option
              v-for="option in actionOptions"
              :key="option.value || 'all'"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </label>

        <label class="field">
          <span>Outcome</span>
          <select v-model="selectedOutcome" :disabled="isLoading">
            <option
              v-for="option in outcomeOptions"
              :key="option.value || 'all'"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </label>

        <label class="field search-field">
          <span>Admin email, target ID, or request ID</span>
          <input
            v-model="searchQuery"
            type="search"
            maxlength="100"
            autocomplete="off"
            placeholder="Search activity"
            :disabled="isLoading"
          >
        </label>

        <label class="field page-size-field">
          <span>Rows</span>
          <select v-model="limit" :disabled="isLoading">
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </label>

        <div class="button-row filter-actions">
          <button class="primary-button" type="submit" :disabled="isLoading">
            Apply filters
          </button>

          <button
            class="secondary-button"
            type="button"
            :disabled="isLoading || !hasActiveFilters"
            @click="void clearFilters()"
          >
            Clear
          </button>
        </div>
      </form>

      <p class="helper-text">
        Search supports admin emails, submission or tag IDs, and request IDs.
      </p>
    </section>

    <section class="admin-card results-card">
      <div class="section-header">
        <div>
          <p class="eyebrow">History</p>
          <h2>Recent admin activity</h2>
        </div>

        <p class="result-count" aria-live="polite">
          {{ visibleRangeStart }}–{{ visibleRangeEnd }} of {{ pagination.total }}
        </p>
      </div>

      <AppStateMessage
        v-if="isLoading"
        variant="loading"
        message="Loading admin activity..."
      />

      <div v-else-if="errorMessage" class="error-state">
        <AppStateMessage
          variant="error"
          eyebrow="Could not load activity"
          title="Admin history is temporarily unavailable."
          :message="errorMessage"
        />

        <button
          class="secondary-button"
          type="button"
          @click="void loadAuditEvents()"
        >
          Try again
        </button>
      </div>

      <AppStateMessage
        v-else-if="!hasEvents"
        variant="empty"
        eyebrow="No activity"
        title="No admin events matched these filters."
        message="Try clearing a filter or check again after another admin action."
      />

      <ol v-else class="activity-list">
        <li v-for="event in events" :key="event.id" class="activity-item">
          <article class="activity-card">
            <header class="activity-header">
              <div>
                <p class="activity-action">
                  {{ formatAdminAuditAction(event.action) }}
                </p>
                <p class="activity-time">
                  {{ formatAdminDate(event.createdAt) }}
                </p>
              </div>

              <span
                class="outcome-badge"
                :class="getAdminAuditOutcomeClass(event.outcome)"
              >
                {{ formatAdminAuditOutcome(event.outcome) }}
              </span>
            </header>

            <dl class="activity-details">
              <div>
                <dt>Administrator</dt>
                <dd>{{ event.actorEmail || 'System or unknown admin' }}</dd>
              </div>

              <div>
                <dt>Target</dt>
                <dd>{{ formatAdminAuditTarget(event) }}</dd>
              </div>

              <div>
                <dt>Duration</dt>
                <dd>{{ getAdminAuditDurationLabel(event) }}</dd>
              </div>

              <div>
                <dt>Request ID</dt>
                <dd class="mono-value">{{ event.requestId }}</dd>
              </div>
            </dl>

            <div v-if="event.errorMessage" class="audit-error">
              <strong>Failure details</strong>
              <span>
                {{ event.errorCode ? `${event.errorCode}: ` : '' }}{{ event.errorMessage }}
              </span>
            </div>

            <div class="activity-actions">
              <NuxtLink
                v-if="getAdminAuditSubmissionLink(event)"
                class="text-link"
                :to="getAdminAuditSubmissionLink(event)!"
              >
                Open related submission
              </NuxtLink>

              <button
                v-if="hasAdminAuditMetadata(event)"
                class="text-button"
                type="button"
                :aria-expanded="isMetadataExpanded(event.id)"
                @click="toggleMetadata(event.id)"
              >
                {{ isMetadataExpanded(event.id) ? 'Hide metadata' : 'Show metadata' }}
              </button>
            </div>

            <pre
              v-if="hasAdminAuditMetadata(event) && isMetadataExpanded(event.id)"
              class="metadata-block"
            >{{ formatMetadata(event) }}</pre>
          </article>
        </li>
      </ol>

      <div v-if="!isLoading && !errorMessage" class="pagination-row">
        <button
          class="secondary-button"
          type="button"
          :disabled="pagination.offset === 0"
          @click="void goToPreviousPage()"
        >
          Previous
        </button>

        <button
          class="secondary-button"
          type="button"
          :disabled="!pagination.hasMore"
          @click="void goToNextPage()"
        >
          Next
        </button>
      </div>
    </section>
  </section>
</template>

<style scoped>
.activity-stack {
  display: grid;
  gap: 1rem;
}

.admin-card {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 1.5rem;
  box-shadow: 0 1rem 3rem rgba(15, 23, 42, 0.08);
  padding: 1.25rem;
}

.section-header {
  align-items: start;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
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

.filter-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 1.25rem;
}

.field {
  display: grid;
  gap: 0.45rem;
}

.field span {
  color: #0f172a;
  font-size: 0.92rem;
  font-weight: 900;
}

input,
select {
  background: #fff;
  border: 1px solid rgba(100, 116, 139, 0.38);
  border-radius: 0.9rem;
  color: #0f172a;
  font: inherit;
  min-height: 3rem;
  padding: 0.75rem 0.9rem;
  width: 100%;
}

input:focus,
select:focus {
  border-color: #0f766e;
  outline: 3px solid rgba(20, 184, 166, 0.18);
}

.search-field {
  grid-column: span 2;
}

.page-size-field {
  max-width: 9rem;
}

.button-row,
.activity-actions,
.pagination-row {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.filter-actions {
  align-self: end;
}

.primary-button,
.secondary-button,
.text-button {
  border-radius: 999px;
  cursor: pointer;
  font: inherit;
  font-weight: 900;
  min-height: 2.75rem;
  padding: 0.75rem 1rem;
}

.primary-button {
  background: #0f766e;
  border: 1px solid #0f766e;
  color: #fff;
}

.secondary-button {
  background: #fff;
  border: 1px solid rgba(100, 116, 139, 0.38);
  color: #0f172a;
}

.text-button {
  background: transparent;
  border: 0;
  color: #0f766e;
  min-height: auto;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 0.2rem;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.helper-text,
.result-count {
  color: #64748b;
  line-height: 1.5;
}

.helper-text {
  margin: 1rem 0 0;
}

.result-count {
  font-weight: 800;
  margin: 0;
}

.activity-list {
  display: grid;
  gap: 0.85rem;
  list-style: none;
  margin: 1.25rem 0 0;
  padding: 0;
}

.activity-card {
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 1.1rem;
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.activity-header {
  align-items: start;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}

.activity-action {
  color: #0f172a;
  font-size: 1.05rem;
  font-weight: 900;
  margin: 0;
}

.activity-time {
  color: #64748b;
  margin: 0.3rem 0 0;
}

.outcome-badge {
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 900;
  padding: 0.45rem 0.7rem;
  text-transform: uppercase;
}

.audit-outcome-started {
  background: #fef3c7;
  color: #92400e;
}

.audit-outcome-succeeded {
  background: #d1fae5;
  color: #065f46;
}

.audit-outcome-failed {
  background: #fee2e2;
  color: #991b1b;
}

.activity-details {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
}

.activity-details div {
  min-width: 0;
}

.activity-details dt {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.activity-details dd {
  color: #0f172a;
  line-height: 1.45;
  margin: 0.25rem 0 0;
  overflow-wrap: anywhere;
}

.mono-value,
.metadata-block {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.audit-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.9rem;
  color: #991b1b;
  display: grid;
  gap: 0.3rem;
  line-height: 1.5;
  padding: 0.85rem;
}

.text-link {
  color: #0f766e;
  font-weight: 900;
  text-decoration: underline;
  text-underline-offset: 0.2rem;
}

.metadata-block {
  background: #0f172a;
  border-radius: 0.9rem;
  color: #e2e8f0;
  font-size: 0.82rem;
  line-height: 1.5;
  margin: 0;
  max-height: 20rem;
  overflow: auto;
  padding: 1rem;
  white-space: pre-wrap;
}

.error-state {
  display: grid;
  gap: 1rem;
  justify-items: start;
  margin-top: 1rem;
}

.pagination-row {
  justify-content: flex-end;
  margin-top: 1.25rem;
}

@media (max-width: 760px) {
  .admin-card {
    border-radius: 1.25rem;
    padding: 1rem;
  }

  .filter-grid,
  .activity-details {
    grid-template-columns: 1fr;
  }

  .search-field {
    grid-column: auto;
  }

  .page-size-field {
    max-width: none;
  }

  .section-header,
  .activity-header {
    align-items: stretch;
    flex-direction: column;
  }

  .outcome-badge {
    align-self: start;
  }

  .pagination-row {
    justify-content: stretch;
  }

  .pagination-row .secondary-button {
    flex: 1;
  }
}
</style>
