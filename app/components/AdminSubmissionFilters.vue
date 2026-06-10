<template>
  <section class="admin-card">
    <div class="section-header">
      <div>
        <p class="eyebrow">Queue</p>

        <h2>Submission queue</h2>
      </div>

      <button
        class="secondary-button"
        type="button"
        :disabled="isLoading"
        @click="$emit('refresh')"
      >
        Refresh
      </button>
    </div>

    <div class="summary-grid">
      <button
        class="summary-card"
        type="button"
        :class="{ active: selectedStatus === '' }"
        @click="$emit('select-all-status')"
      >
        <span>All</span>
        <strong>{{ totalSummaryCount }}</strong>
      </button>

      <button
        class="summary-card"
        type="button"
        :class="{ active: selectedStatus === 'pending' }"
        @click="$emit('select-summary-status', 'pending')"
      >
        <span>Pending</span>
        <strong>{{ summaryCounts.pending }}</strong>
      </button>

      <button
        class="summary-card"
        type="button"
        :class="{ active: selectedStatus === 'approved' }"
        @click="$emit('select-summary-status', 'approved')"
      >
        <span>Approved</span>
        <strong>{{ summaryCounts.approved }}</strong>
      </button>

      <button
        class="summary-card"
        type="button"
        :class="{ active: selectedStatus === 'rejected' }"
        @click="$emit('select-summary-status', 'rejected')"
      >
        <span>Rejected</span>
        <strong>{{ summaryCounts.rejected }}</strong>
      </button>
    </div>

    <div class="filter-grid">
      <label class="field">
        <span>Status</span>

        <select
          :value="selectedStatus"
          @change="updateSelectedStatus"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </label>

      <label class="field">
        <span>Search</span>

        <input
          :value="searchQuery"
          type="search"
          placeholder="Search rider, title, clue, or location"
          @input="updateSearchQuery"
        >
      </label>

      <label class="field">
        <span>Page size</span>

        <select
          :value="limit"
          @change="updateLimit"
        >
          <option :value="10">10 submissions</option>
          <option :value="25">25 submissions</option>
          <option :value="50">50 submissions</option>
        </select>
      </label>
    </div>

    <label class="checkbox-field">
      <input
        :checked="includeArchivedSubmissions"
        type="checkbox"
        @change="updateIncludeArchivedSubmissions"
      >

      <span>Include archived submissions</span>
    </label>

    <div class="button-row">
      <button
        class="primary-button"
        type="button"
        :disabled="isLoading"
        @click="$emit('apply-filters')"
      >
        Apply filters
      </button>

      <button
        class="secondary-button"
        type="button"
        :disabled="!hasActiveSubmissionFilters || isLoading"
        @click="$emit('clear-filters')"
      >
        Clear filters
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
type SubmissionStatusFilter = '' | 'pending' | 'approved' | 'rejected'

type SummaryCounts = {
  pending: number
  approved: number
  rejected: number
}

defineProps<{
  selectedStatus: SubmissionStatusFilter
  searchQuery: string
  limit: number
  includeArchivedSubmissions: boolean
  isLoading: boolean
  summaryCounts: SummaryCounts
  totalSummaryCount: number
  hasActiveSubmissionFilters: boolean
}>()

const emit = defineEmits<{
  refresh: []
  'apply-filters': []
  'clear-filters': []
  'select-all-status': []
  'select-summary-status': [status: Exclude<SubmissionStatusFilter, ''>]
  'update:selectedStatus': [value: SubmissionStatusFilter]
  'update:searchQuery': [value: string]
  'update:limit': [value: number]
  'update:includeArchivedSubmissions': [value: boolean]
}>()

const getInputValue = (event: Event) => {
  return event.target instanceof HTMLInputElement ? event.target.value : ''
}

const getSelectValue = (event: Event) => {
  return event.target instanceof HTMLSelectElement ? event.target.value : ''
}

const updateSelectedStatus = (event: Event) => {
  const value = getSelectValue(event)

  if (
    value === '' ||
    value === 'pending' ||
    value === 'approved' ||
    value === 'rejected'
  ) {
    emit('update:selectedStatus', value)
  }
}

const updateSearchQuery = (event: Event) => {
  emit('update:searchQuery', getInputValue(event))
}

const updateLimit = (event: Event) => {
  const value = Number(getSelectValue(event))

  if ([10, 25, 50].includes(value)) {
    emit('update:limit', value)
  }
}

const updateIncludeArchivedSubmissions = (event: Event) => {
  const isChecked =
    event.target instanceof HTMLInputElement ? event.target.checked : false

  emit('update:includeArchivedSubmissions', isChecked)
}
</script>

<style scoped>
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

.summary-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 1rem;
}

.summary-card {
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 1rem;
  color: #334155;
  cursor: pointer;
  display: grid;
  gap: 0.25rem;
  padding: 1rem;
  text-align: left;
}

.summary-card strong {
  color: #0f172a;
  font-size: 1.6rem;
}

.summary-card.active {
  background: rgba(20, 184, 166, 0.12);
  border-color: rgba(15, 118, 110, 0.35);
}

.filter-grid {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
}

.field {
  display: grid;
  gap: 0.45rem;
}

.field span,
.checkbox-field span {
  color: #334155;
  font-size: 0.9rem;
  font-weight: 700;
}

input,
select {
  background: #fff;
  border: 1px solid rgba(100, 116, 139, 0.38);
  border-radius: 999px;
  color: #0f172a;
  font: inherit;
  padding: 0.85rem 1rem;
  width: 100%;
}

input:focus,
select:focus {
  border-color: #0f766e;
  outline: 3px solid rgba(20, 184, 166, 0.18);
}

.checkbox-field {
  align-items: center;
  display: flex;
  gap: 0.6rem;
  margin-top: 1rem;
}

.checkbox-field input {
  width: auto;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1rem;
}

.primary-button,
.secondary-button {
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

.primary-button:disabled,
.secondary-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

@media (min-width: 700px) {
  .summary-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .filter-grid {
    grid-template-columns: 12rem minmax(0, 1fr) 12rem;
  }
}

@media (max-width: 860px) {
  .admin-card {
    border-radius: 1.25rem;
    padding: 1rem;
  }

  .section-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.5rem;
  }

  .button-row {
    display: grid;
    grid-template-columns: 1fr;
  }

  .primary-button,
  .secondary-button {
    min-height: 3rem;
    width: 100%;
  }
}

@media (max-width: 520px) {
  input,
  select {
    font-size: 1rem;
  }
}
</style>