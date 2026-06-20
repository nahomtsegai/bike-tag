<script setup lang="ts">
type CleanupRun = {
  id: string
  environment: string
  status: 'succeeded' | 'failed'
  candidateCount: number | null
  candidateSizeBytes: number | null
  scannedFileCount: number | null
  referencedFileCount: number | null
  errorMessage: string | null
  completedAt: string
  candidateCountChange: number | null
}

type CleanupResponse = {
  environment: string
  runs: CleanupRun[]
}

const isLoading = ref(true)
const isRunning = ref(false)
const errorMessage = ref('')
const environment = ref('')
const runs = ref<CleanupRun[]>([])

const latestSuccess = computed(() => {
  return runs.value.find((run) => run.status === 'succeeded') ?? null
})

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

const formatBytes = (value: number | null) => {
  if (value === null) return 'Unavailable'
  if (value < 1024) return `${value} B`
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / 1024 ** 2).toFixed(1)} MB`
}

const loadRuns = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const response = await $fetch<CleanupResponse>(
      '/api/admin/storage-cleanup/runs',
      { query: { limit: 30 } }
    )
    environment.value = response.environment
    runs.value = response.runs
  } catch (error) {
    errorMessage.value = error instanceof Error
      ? error.message
      : 'Could not load storage cleanup history.'
  } finally {
    isLoading.value = false
  }
}

const runDryScan = async () => {
  isRunning.value = true
  try {
    await $fetch('/api/admin/storage-cleanup/dry-run', { method: 'POST' })
  } catch (error) {
    errorMessage.value = error instanceof Error
      ? error.message
      : 'Could not run the storage cleanup scan.'
  } finally {
    isRunning.value = false
    await loadRuns()
  }
}

onMounted(() => void loadRuns())
</script>

<template>
  <section class="cleanup-stack">
    <section class="admin-card">
      <div class="section-header">
        <div>
          <p class="eyebrow">Observation only</p>
          <h2>{{ environment || 'Current environment' }}</h2>
        </div>
        <div class="button-row">
          <button class="secondary-button" type="button" @click="void loadRuns()">
            Refresh
          </button>
          <button
            class="primary-button"
            type="button"
            :disabled="isRunning"
            @click="void runDryScan()"
          >
            {{ isRunning ? 'Scanning...' : 'Run dry scan' }}
          </button>
        </div>
      </div>

      <AppStateMessage
        v-if="isLoading"
        variant="loading"
        message="Loading storage cleanup trends..."
      />
      <AppStateMessage
        v-else-if="errorMessage"
        variant="error"
        title="Cleanup trends are unavailable."
        :message="errorMessage"
      />
      <div v-else class="summary-grid">
        <article>
          <span>Candidates</span>
          <strong>{{ latestSuccess?.candidateCount ?? 0 }}</strong>
          <small>
            {{ latestSuccess?.candidateCountChange ?? 0 }} from prior successful scan
          </small>
        </article>
        <article>
          <span>Estimated size</span>
          <strong>{{ formatBytes(latestSuccess?.candidateSizeBytes ?? 0) }}</strong>
        </article>
        <article>
          <span>Files scanned</span>
          <strong>{{ latestSuccess?.scannedFileCount ?? 0 }}</strong>
          <small>{{ latestSuccess?.referencedFileCount ?? 0 }} referenced</small>
        </article>
      </div>
    </section>

    <section class="admin-card">
      <div class="section-header">
        <div>
          <p class="eyebrow">Recent history</p>
          <h2>Cleanup scans</h2>
        </div>
        <span>{{ runs.length }} runs</span>
      </div>

      <AppStateMessage
        v-if="!isLoading && runs.length === 0"
        variant="empty"
        title="No cleanup scans recorded yet."
        message="Run a dry scan or wait for the scheduled scanner."
      />

      <ol v-else class="run-list">
        <li v-for="run in runs" :key="run.id">
          <article class="run-card">
            <header>
              <strong>{{ formatDate(run.completedAt) }}</strong>
              <span :class="`status-${run.status}`">{{ run.status }}</span>
            </header>
            <p v-if="run.status === 'failed'" class="failure-copy">
              {{ run.errorMessage || 'Scan failed without a recorded message.' }}
            </p>
            <dl v-else>
              <div><dt>Candidates</dt><dd>{{ run.candidateCount ?? 0 }}</dd></div>
              <div><dt>Size</dt><dd>{{ formatBytes(run.candidateSizeBytes) }}</dd></div>
              <div><dt>Scanned</dt><dd>{{ run.scannedFileCount ?? 0 }}</dd></div>
            </dl>
          </article>
        </li>
      </ol>
    </section>
  </section>
</template>

<style scoped>
.cleanup-stack,.run-list{display:grid;gap:1rem}.admin-card{background:#fff;border:1px solid #e2e8f0;border-radius:1.5rem;padding:1.25rem}.section-header{display:flex;justify-content:space-between;gap:1rem}.section-header h2{margin:.25rem 0 0}.eyebrow{color:#b45309;font-size:.8rem;font-weight:800;letter-spacing:.14em;margin:0;text-transform:uppercase}.button-row{display:flex;gap:.6rem}.primary-button,.secondary-button{border-radius:999px;font-weight:800;padding:.7rem 1rem}.primary-button{background:#b45309;border:1px solid #b45309;color:#fff}.secondary-button{background:#fff;border:1px solid #cbd5e1}.summary-grid{display:grid;gap:1rem;grid-template-columns:repeat(3,1fr);margin-top:1rem}.summary-grid article,.run-card{background:#f8fafc;border-radius:1rem;padding:1rem}.summary-grid article{display:grid;gap:.3rem}.summary-grid strong{font-size:1.8rem}.summary-grid span,.summary-grid small{color:#64748b}.run-list{list-style:none;margin:1rem 0 0;padding:0}.run-card header{display:flex;justify-content:space-between}.run-card dl{display:grid;grid-template-columns:repeat(3,1fr);gap:.75rem}.run-card dd{font-weight:800;margin:.25rem 0 0}.status-succeeded{color:#166534}.status-failed,.failure-copy{color:#991b1b}@media(max-width:700px){.section-header{flex-direction:column}.button-row,.summary-grid,.run-card dl{display:grid;grid-template-columns:1fr}}
</style>
