<script setup lang="ts">
import type {
  AdminSubmitErrorEvent,
  AdminSubmitErrorFilter
} from '~/types/adminSubmitErrors'
import { getAdminSubmitErrors } from '~/utils/adminSubmitErrorsApi'
import { formatAdminDate } from '~/utils/adminSubmissions'

const filterOptions: Array<{
  label: string
  value: AdminSubmitErrorFilter
  description: string
}> = [
  {
    label: 'All',
    value: 'all',
    description: 'Recent submit diagnostic events.'
  },
  {
    label: 'Failures',
    value: 'failures',
    description: 'Events that look like submit failures or errors.'
  },
  {
    label: 'Payload',
    value: 'payload',
    description: '413 payload-size and function payload errors.'
  },
  {
    label: 'Compression',
    value: 'compression',
    description: 'Photo preparation and compression events.'
  },
  {
    label: 'API',
    value: 'api',
    description: 'Server-side submit API breadcrumbs.'
  }
]

const selectedFilter = ref<AdminSubmitErrorFilter>('failures')
const limit = ref(50)
const offset = ref(0)
const isLoading = ref(false)
const errorMessage = ref('')
const events = ref<AdminSubmitErrorEvent[]>([])
const expandedEventIds = ref<Set<string>>(new Set())

const pagination = ref({
  limit: 50,
  offset: 0,
  count: 0,
  hasMore: false
})

const selectedFilterDescription = computed(() => {
  return filterOptions.find((filterOption) => {
    return filterOption.value === selectedFilter.value
  })?.description || ''
})

const hasEvents = computed(() => {
  return events.value.length > 0
})

const getEventMetadataValue = (
  event: AdminSubmitErrorEvent,
  key: string
) => {
  const value = event.metadata?.[key]

  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null
  }

  return value
}

const getRequestId = (event: AdminSubmitErrorEvent) => {
  const requestId = getEventMetadataValue(event, 'requestId')

  if (typeof requestId !== 'string') {
    return null
  }

  return requestId
}

const getErrorStatusCode = (event: AdminSubmitErrorEvent) => {
  const statusCode =
    getEventMetadataValue(event, 'errorStatusCode') ||
    getEventMetadataValue(event, 'statusCode')

  if (
    typeof statusCode !== 'string' &&
    typeof statusCode !== 'number'
  ) {
    return null
  }

  return String(statusCode)
}

const formatBytes = (value: unknown) => {
  const numericValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : Number.NaN

  if (!Number.isFinite(numericValue)) {
    return null
  }

  if (numericValue < 1_000_000) {
    return `${Math.round(numericValue / 1_000)} KB`
  }

  return `${(numericValue / 1_000_000).toFixed(2)} MB`
}

const getPhotoSizeSummary = (event: AdminSubmitErrorEvent) => {
  const originalMatchPhotoSize = formatBytes(
    getEventMetadataValue(event, 'originalMatchPhotoSize')
  )
  const compressedMatchPhotoSize = formatBytes(
    getEventMetadataValue(event, 'compressedMatchPhotoSize')
  )
  const originalNextPhotoSize = formatBytes(
    getEventMetadataValue(event, 'originalNextPhotoSize')
  )
  const compressedNextPhotoSize = formatBytes(
    getEventMetadataValue(event, 'compressedNextPhotoSize')
  )

  const photoSizes = [
    originalMatchPhotoSize && compressedMatchPhotoSize
      ? `Match ${originalMatchPhotoSize} → ${compressedMatchPhotoSize}`
      : null,
    originalNextPhotoSize && compressedNextPhotoSize
      ? `Next ${originalNextPhotoSize} → ${compressedNextPhotoSize}`
      : null
  ].filter(Boolean)

  return photoSizes.join(' · ')
}

const getEventSummaryItems = (event: AdminSubmitErrorEvent) => {
  return [
    {
      label: 'Step',
      value: event.step
    },
    {
      label: 'Status',
      value: getErrorStatusCode(event)
    },
    {
      label: 'Session',
      value: event.sessionId
    },
    {
      label: 'Request',
      value: getRequestId(event)
    },
    {
      label: 'Photos',
      value: getPhotoSizeSummary(event)
    }
  ].filter((item) => {
    return Boolean(item.value)
  })
}

const getEventToneClass = (event: AdminSubmitErrorEvent) => {
  const eventName = event.eventName.toLowerCase()
  const message = event.message?.toLowerCase() || ''

  if (
    eventName.includes('failed') ||
    eventName.includes('error') ||
    message.includes('failed') ||
    message.includes('error') ||
    getErrorStatusCode(event)
  ) {
    return 'event-card-danger'
  }

  if (
    eventName.includes('compress') ||
    eventName === 'submit_photos_prepared'
  ) {
    return 'event-card-info'
  }

  if (eventName.startsWith('api_')) {
    return 'event-card-api'
  }

  return ''
}

const isEventExpanded = (eventId: string) => {
  return expandedEventIds.value.has(eventId)
}

const toggleEventMetadata = (eventId: string) => {
  const nextExpandedEventIds = new Set(expandedEventIds.value)

  if (nextExpandedEventIds.has(eventId)) {
    nextExpandedEventIds.delete(eventId)
  } else {
    nextExpandedEventIds.add(eventId)
  }

  expandedEventIds.value = nextExpandedEventIds
}

const formatMetadata = (metadata: Record<string, unknown> | null) => {
  if (!metadata) {
    return 'No metadata captured.'
  }

  return JSON.stringify(metadata, null, 2)
}

const loadSubmitErrors = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await getAdminSubmitErrors({
      filter: selectedFilter.value,
      limit: limit.value,
      offset: offset.value
    })

    events.value = response.events
    pagination.value = response.pagination
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Could not load submit errors.'
  } finally {
    isLoading.value = false
  }
}

const applyFilter = async (filter: AdminSubmitErrorFilter) => {
  selectedFilter.value = filter
  offset.value = 0
  expandedEventIds.value = new Set()

  await loadSubmitErrors()
}

const refreshSubmitErrors = async () => {
  await loadSubmitErrors()
}

const goToPreviousPage = async () => {
  offset.value = Math.max(0, offset.value - limit.value)
  await loadSubmitErrors()
}

const goToNextPage = async () => {
  offset.value = offset.value + limit.value
  await loadSubmitErrors()
}

onMounted(() => {
  void loadSubmitErrors()
})
</script>

<template>
  <main class="admin-page">
    <section class="admin-hero">
      <p class="eyebrow">Admin Errors</p>
      <h1>Submit Errors</h1>
      <p class="hero-copy">
        Review submit diagnostics, payload failures, and API breadcrumbs.
      </p>
    </section>

    <AdminAuthGate>
      <section class="admin-card">
        <div class="section-header">
          <div>
            <p class="eyebrow">Diagnostics</p>
            <h2>Submit event filters</h2>
          </div>

          <button
            class="secondary-button"
            type="button"
            :disabled="isLoading"
            @click="void refreshSubmitErrors()"
          >
            Refresh
          </button>
        </div>

        <div class="filter-grid">
          <button
            v-for="filterOption in filterOptions"
            :key="filterOption.value"
            class="filter-card"
            type="button"
            :class="{ selected: selectedFilter === filterOption.value }"
            :disabled="isLoading"
            @click="void applyFilter(filterOption.value)"
          >
            <span>{{ filterOption.label }}</span>
            <small>{{ filterOption.description }}</small>
          </button>
        </div>

        <p class="helper-text">
          {{ selectedFilterDescription }}
        </p>

        <div class="button-row">
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

        <p class="pagination-summary">
          Showing {{ events.length }} of {{ pagination.count }} matching events.
          Offset: {{ pagination.offset }}.
        </p>

        <p
          v-if="errorMessage"
          class="error-message"
        >
          {{ errorMessage }}
        </p>
      </section>

      <section class="admin-card">
        <div class="section-header">
          <div>
            <p class="eyebrow">Results</p>
            <h2>Recent submit events</h2>
          </div>
        </div>

        <AppStateMessage
          v-if="isLoading"
          variant="loading"
          message="Loading submit diagnostics..."
        />

        <AppStateMessage
          v-else-if="!hasEvents"
          variant="empty"
          eyebrow="No events"
          title="No matching submit diagnostics found."
          message="Try a different filter or check again after another submit attempt."
        />

        <ul
          v-else
          class="event-list"
        >
          <li
            v-for="event in events"
            :key="event.id"
            class="event-card"
            :class="getEventToneClass(event)"
          >
            <div class="event-header">
              <div>
                <p class="event-name">
                  {{ event.eventName }}
                </p>

                <p class="event-time">
                  {{ formatAdminDate(event.createdAt) }}
                </p>
              </div>

              <button
                class="metadata-toggle-button"
                type="button"
                @click="toggleEventMetadata(event.id)"
              >
                {{ isEventExpanded(event.id) ? 'Hide metadata' : 'Show metadata' }}
              </button>
            </div>

            <p
              v-if="event.message"
              class="event-message"
            >
              {{ event.message }}
            </p>

            <dl
              v-if="getEventSummaryItems(event).length"
              class="event-summary-grid"
            >
              <div
                v-for="item in getEventSummaryItems(event)"
                :key="item.label"
              >
                <dt>{{ item.label }}</dt>
                <dd>{{ item.value }}</dd>
              </div>
            </dl>

            <p
              v-if="event.userAgent"
              class="user-agent"
            >
              {{ event.userAgent }}
            </p>

            <pre
              v-if="isEventExpanded(event.id)"
              class="metadata-block"
            >{{ formatMetadata(event.metadata) }}</pre>
          </li>
        </ul>
      </section>
    </AdminAuthGate>
  </main>
</template>

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

.admin-card {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 1.5rem;
  box-shadow: 0 1rem 3rem rgba(15, 23, 42, 0.08);
  padding: 1.25rem;
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

.filter-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
}

.filter-card {
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.32);
  border-radius: 1rem;
  cursor: pointer;
  display: grid;
  font: inherit;
  gap: 0.35rem;
  padding: 1rem;
  text-align: left;
}

.filter-card:hover,
.filter-card:focus {
  border-color: #0f766e;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.12);
  outline: none;
}

.filter-card.selected {
  background: #ecfeff;
  border-color: #0f766e;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.18);
}

.filter-card:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.filter-card span {
  color: #0f172a;
  font-weight: 900;
}

.filter-card small {
  color: #64748b;
  line-height: 1.4;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1rem;
}

.secondary-button,
.metadata-toggle-button {
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  font: inherit;
  font-weight: 800;
  padding: 0.85rem 1.15rem;
}

.secondary-button {
  background: #e2e8f0;
  color: #0f172a;
}

.metadata-toggle-button {
  background: #0f172a;
  color: #fff;
  white-space: nowrap;
}

.secondary-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.helper-text,
.pagination-summary {
  color: #64748b;
  margin: 1rem 0 0;
}

.error-message {
  background: #fef2f2;
  border-radius: 1rem;
  color: #991b1b;
  font-weight: 700;
  margin: 1rem 0 0;
  padding: 1rem;
}

.event-list {
  display: grid;
  gap: 1rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.event-card {
  background: #fff;
  border: 1px solid rgba(148, 163, 184, 0.32);
  border-radius: 1.25rem;
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.event-card-danger {
  background: #fef2f2;
  border-color: rgba(239, 68, 68, 0.28);
}

.event-card-info {
  background: #ecfeff;
  border-color: rgba(20, 184, 166, 0.28);
}

.event-card-api {
  background: #f8fafc;
}

.event-header {
  align-items: flex-start;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}

.event-name {
  color: #0f172a;
  font-size: 1rem;
  font-weight: 900;
  margin: 0;
  overflow-wrap: anywhere;
}

.event-time {
  color: #64748b;
  font-size: 0.9rem;
  margin: 0.35rem 0 0;
}

.event-message {
  color: #334155;
  line-height: 1.55;
  margin: 0;
  overflow-wrap: anywhere;
}

.event-summary-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  margin: 0;
}

.event-summary-grid div {
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 0.85rem;
  padding: 0.8rem;
}

.event-summary-grid dt {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 750;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.event-summary-grid dd {
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 650;
  line-height: 1.35;
  margin: 0.25rem 0 0;
  overflow-wrap: anywhere;
}

.user-agent {
  color: #64748b;
  font-size: 0.85rem;
  line-height: 1.45;
  margin: 0;
  overflow-wrap: anywhere;
}

.metadata-block {
  background: #0f172a;
  border-radius: 1rem;
  color: #e2e8f0;
  font-size: 0.85rem;
  line-height: 1.55;
  margin: 0;
  max-height: 24rem;
  overflow: auto;
  padding: 1rem;
  white-space: pre-wrap;
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

  .admin-card {
    border-radius: 1.25rem;
    padding: 1rem;
  }

  .section-header,
  .event-header {
    align-items: stretch;
    flex-direction: column;
    gap: 0.75rem;
  }

  .button-row {
    display: grid;
    grid-template-columns: 1fr;
  }

  .secondary-button,
  .metadata-toggle-button {
    min-height: 3rem;
    width: 100%;
  }
}

@media (max-width: 520px) {
  .admin-page {
    padding: 0.75rem;
  }

  .filter-grid {
    grid-template-columns: 1fr;
  }
}
</style>