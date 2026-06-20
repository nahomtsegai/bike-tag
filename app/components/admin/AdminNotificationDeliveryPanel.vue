<script setup lang="ts">
type NotificationStatus = 'pending' | 'sent' | 'failed'

type NotificationAttempt = {
  id: string
  submissionId: string
  riderName: string
  nextTitle: string
  environment: string
  status: NotificationStatus
  attemptNumber: number
  retryOfId: string | null
  providerMessageId: string | null
  errorMessage: string | null
  startedAt: string
  completedAt: string | null
  createdAt: string
}

type NotificationResponse = {
  environment: string
  attempts: NotificationAttempt[]
}

const selectedStatus = ref<'all' | NotificationStatus>('all')
const isLoading = ref(true)
const errorMessage = ref('')
const environment = ref('')
const attempts = ref<NotificationAttempt[]>([])
const retryingAttemptIds = ref<string[]>([])

const failedCount = computed(() => {
  return attempts.value.filter((attempt) => attempt.status === 'failed').length
})

const pendingCount = computed(() => {
  return attempts.value.filter((attempt) => attempt.status === 'pending').length
})

const sentCount = computed(() => {
  return attempts.value.filter((attempt) => attempt.status === 'sent').length
})

const formatDate = (value: string | null) => {
  if (!value) return 'Not completed'

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

const isRetrying = (attemptId: string) => {
  return retryingAttemptIds.value.includes(attemptId)
}

const loadAttempts = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await $fetch<NotificationResponse>(
      '/api/admin/notifications',
      {
        query: {
          limit: 50,
          status: selectedStatus.value === 'all' ? undefined : selectedStatus.value
        }
      }
    )

    environment.value = response.environment
    attempts.value = response.attempts
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Could not load notification delivery history.'
  } finally {
    isLoading.value = false
  }
}

const retryAttempt = async (attemptId: string) => {
  if (isRetrying(attemptId)) return

  retryingAttemptIds.value = [...retryingAttemptIds.value, attemptId]
  errorMessage.value = ''

  try {
    await $fetch(`/api/admin/notifications/${attemptId}/retry`, {
      method: 'POST'
    })
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Could not retry the notification.'
  } finally {
    retryingAttemptIds.value = retryingAttemptIds.value.filter(
      (id) => id !== attemptId
    )
    await loadAttempts()
  }
}

watch(selectedStatus, () => {
  void loadAttempts()
})

onMounted(() => {
  void loadAttempts()
})
</script>

<template>
  <section class="delivery-stack">
    <section class="admin-card">
      <div class="section-header">
        <div>
          <p class="eyebrow">Current environment</p>
          <h2>{{ environment || 'Loading' }}</h2>
        </div>

        <div class="controls">
          <label>
            <span>Status</span>
            <select v-model="selectedStatus">
              <option value="all">All attempts</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
            </select>
          </label>

          <button type="button" class="secondary-button" @click="void loadAttempts()">
            Refresh
          </button>
        </div>
      </div>

      <div class="summary-grid">
        <article>
          <span>Failed</span>
          <strong>{{ failedCount }}</strong>
        </article>
        <article>
          <span>Pending</span>
          <strong>{{ pendingCount }}</strong>
        </article>
        <article>
          <span>Sent</span>
          <strong>{{ sentCount }}</strong>
        </article>
      </div>
    </section>

    <section class="admin-card">
      <AppStateMessage
        v-if="isLoading"
        variant="loading"
        message="Loading notification attempts..."
      />

      <AppStateMessage
        v-else-if="errorMessage"
        variant="error"
        title="Notification history is unavailable."
        :message="errorMessage"
      />

      <AppStateMessage
        v-else-if="attempts.length === 0"
        variant="empty"
        title="No notification attempts found."
        message="New submission notifications will appear here."
      />

      <ol v-else class="attempt-list">
        <li v-for="attempt in attempts" :key="attempt.id">
          <article class="attempt-card">
            <header>
              <div>
                <strong>{{ attempt.nextTitle }}</strong>
                <span>{{ attempt.riderName }} · attempt {{ attempt.attemptNumber }}</span>
              </div>
              <span class="status-badge" :class="`status-${attempt.status}`">
                {{ attempt.status }}
              </span>
            </header>

            <dl>
              <div>
                <dt>Started</dt>
                <dd>{{ formatDate(attempt.startedAt) }}</dd>
              </div>
              <div>
                <dt>Completed</dt>
                <dd>{{ formatDate(attempt.completedAt) }}</dd>
              </div>
              <div>
                <dt>Provider id</dt>
                <dd>{{ attempt.providerMessageId || 'Not returned' }}</dd>
              </div>
            </dl>

            <p v-if="attempt.errorMessage" class="error-copy">
              {{ attempt.errorMessage }}
            </p>

            <footer>
              <NuxtLink
                :to="`/admin/submissions?submissionId=${attempt.submissionId}`"
                class="submission-link"
              >
                Open submission
              </NuxtLink>

              <button
                v-if="attempt.status === 'failed'"
                type="button"
                class="primary-button"
                :disabled="isRetrying(attempt.id)"
                @click="void retryAttempt(attempt.id)"
              >
                {{ isRetrying(attempt.id) ? 'Retrying...' : 'Retry notification' }}
              </button>
            </footer>
          </article>
        </li>
      </ol>
    </section>
  </section>
</template>

<style scoped>
.delivery-stack,.attempt-list{display:grid;gap:1rem}.admin-card{background:#fff;border:1px solid #e2e8f0;border-radius:1.5rem;padding:1.25rem}.section-header,.attempt-card header,.attempt-card footer{display:flex;gap:1rem;justify-content:space-between}.section-header h2{margin:.25rem 0 0}.eyebrow{color:#0e7490;font-size:.8rem;font-weight:800;letter-spacing:.14em;margin:0;text-transform:uppercase}.controls{align-items:end;display:flex;gap:.75rem}.controls label{display:grid;gap:.3rem}.controls label span{color:#64748b;font-size:.78rem;font-weight:800;text-transform:uppercase}.controls select{background:#fff;border:1px solid #cbd5e1;border-radius:.75rem;padding:.7rem}.primary-button,.secondary-button{border-radius:999px;font-weight:800;padding:.7rem 1rem}.primary-button{background:#0e7490;border:1px solid #0e7490;color:#fff}.secondary-button{background:#fff;border:1px solid #cbd5e1}.summary-grid{display:grid;gap:1rem;grid-template-columns:repeat(3,1fr);margin-top:1rem}.summary-grid article{background:#f8fafc;border-radius:1rem;display:grid;gap:.3rem;padding:1rem}.summary-grid span{color:#64748b}.summary-grid strong{font-size:1.8rem}.attempt-list{list-style:none;margin:0;padding:0}.attempt-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:1rem;padding:1rem}.attempt-card header div{display:grid;gap:.25rem}.attempt-card header div span{color:#64748b}.status-badge{border-radius:999px;font-size:.78rem;font-weight:900;padding:.35rem .65rem;text-transform:uppercase}.status-sent{background:#dcfce7;color:#166534}.status-failed{background:#fee2e2;color:#991b1b}.status-pending{background:#fef3c7;color:#92400e}.attempt-card dl{display:grid;gap:.75rem;grid-template-columns:repeat(3,1fr);margin:1rem 0}.attempt-card dt{color:#64748b;font-size:.78rem;font-weight:800;text-transform:uppercase}.attempt-card dd{margin:.25rem 0 0;overflow-wrap:anywhere}.error-copy{background:#fff1f2;border-radius:.75rem;color:#9f1239;padding:.75rem}.submission-link{color:#0e7490;font-weight:800}.primary-button:disabled{cursor:not-allowed;opacity:.6}@media(max-width:760px){.section-header,.attempt-card header,.attempt-card footer,.controls{align-items:stretch;flex-direction:column}.summary-grid,.attempt-card dl{grid-template-columns:1fr}}
</style>
