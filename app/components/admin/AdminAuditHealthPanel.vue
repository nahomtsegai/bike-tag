<script setup lang="ts">
import type { AdminAuditEvent } from '~/types/adminAuditEvents'
import {
  formatAdminAuditAction,
  formatAdminAuditTarget,
  getAdminAuditAgeLabel,
  getAdminAuditSubmissionLink
} from '~/utils/adminAuditEvents'
import { getAdminAuditEvents } from '~/utils/adminAuditEventsApi'
import { formatAdminDate } from '~/utils/adminSubmissions'

const isLoading = ref(false)
const errorMessage = ref('')
const events = ref<AdminAuditEvent[]>([])
const total = ref(0)

const hasIncompleteEvents = computed(() => total.value > 0)

const loadIncompleteEvents = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await getAdminAuditEvents({
      action: '',
      outcome: 'incomplete',
      search: '',
      limit: 5,
      offset: 0
    })

    events.value = response.events
    total.value = response.pagination.total
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Could not check admin audit health.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  void loadIncompleteEvents()
})
</script>

<template>
  <section
    class="admin-card audit-health-card"
    :class="{ 'has-incomplete-events': hasIncompleteEvents }"
    aria-labelledby="auditHealthTitle"
  >
    <div class="section-header">
      <div>
        <p class="eyebrow">Audit health</p>
        <h2 id="auditHealthTitle">Incomplete admin events</h2>
        <p class="section-copy">
          Events that remain started for more than five minutes may indicate
          that an admin action finished without a final audit update.
        </p>
      </div>

      <button
        class="secondary-button"
        type="button"
        :disabled="isLoading"
        @click="void loadIncompleteEvents()"
      >
        Refresh
      </button>
    </div>

    <AppStateMessage
      v-if="isLoading"
      variant="loading"
      message="Checking admin audit health..."
    />

    <div v-else-if="errorMessage" class="error-state">
      <AppStateMessage
        variant="error"
        eyebrow="Audit health unavailable"
        title="Incomplete events could not be checked."
        :message="errorMessage"
      />

      <button
        class="secondary-button"
        type="button"
        @click="void loadIncompleteEvents()"
      >
        Try again
      </button>
    </div>

    <div v-else-if="!hasIncompleteEvents" class="healthy-state" role="status">
      <strong>No incomplete audit events</strong>
      <span>Recent admin actions have a recorded final outcome.</span>
    </div>

    <div v-else class="incomplete-state">
      <div class="incomplete-summary" role="status">
        <strong>{{ total }}</strong>
        <span>
          {{ total === 1 ? 'event needs' : 'events need' }} investigation
        </span>
      </div>

      <p class="investigation-copy">
        Use the request ID to correlate the event with runtime logs before
        repeating the admin action.
      </p>

      <ol class="incomplete-list">
        <li v-for="event in events" :key="event.id">
          <article class="incomplete-event">
            <header>
              <div>
                <strong>{{ formatAdminAuditAction(event.action) }}</strong>
                <span>{{ formatAdminDate(event.createdAt) }}</span>
              </div>

              <span class="incomplete-badge">Incomplete</span>
            </header>

            <dl>
              <div>
                <dt>Age</dt>
                <dd>{{ getAdminAuditAgeLabel(event) }}</dd>
              </div>
              <div>
                <dt>Administrator</dt>
                <dd>{{ event.actorEmail || 'System or unknown admin' }}</dd>
              </div>
              <div>
                <dt>Target</dt>
                <dd>{{ formatAdminAuditTarget(event) }}</dd>
              </div>
              <div>
                <dt>Request ID</dt>
                <dd class="mono-value">{{ event.requestId }}</dd>
              </div>
            </dl>

            <NuxtLink
              v-if="getAdminAuditSubmissionLink(event)"
              class="text-link"
              :to="getAdminAuditSubmissionLink(event)!"
            >
              Open related submission
            </NuxtLink>
          </article>
        </li>
      </ol>

      <p v-if="total > events.length" class="remaining-copy">
        Showing the {{ events.length }} most recent incomplete events.
      </p>
    </div>
  </section>
</template>

<style scoped>
.admin-card {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 1.5rem;
  box-shadow: 0 1rem 3rem rgba(15, 23, 42, 0.08);
  padding: 1.25rem;
}

.audit-health-card {
  display: grid;
  gap: 1rem;
}

.audit-health-card.has-incomplete-events {
  border-color: rgba(217, 119, 6, 0.38);
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

.section-copy,
.investigation-copy,
.remaining-copy {
  color: #64748b;
  line-height: 1.55;
}

.section-copy {
  margin: 0.65rem 0 0;
  max-width: 46rem;
}

.secondary-button {
  background: #fff;
  border: 1px solid rgba(100, 116, 139, 0.38);
  border-radius: 999px;
  color: #0f172a;
  cursor: pointer;
  font: inherit;
  font-weight: 900;
  min-height: 2.75rem;
  padding: 0.75rem 1rem;
}

.secondary-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.healthy-state {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 1rem;
  color: #065f46;
  display: grid;
  gap: 0.3rem;
  line-height: 1.5;
  padding: 1rem;
}

.incomplete-state,
.error-state {
  display: grid;
  gap: 1rem;
}

.error-state {
  justify-items: start;
}

.incomplete-summary {
  align-items: baseline;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 1rem;
  color: #92400e;
  display: flex;
  gap: 0.65rem;
  padding: 1rem;
}

.incomplete-summary strong {
  font-size: 2rem;
  line-height: 1;
}

.incomplete-summary span {
  font-weight: 800;
}

.investigation-copy,
.remaining-copy {
  margin: 0;
}

.incomplete-list {
  display: grid;
  gap: 0.75rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.incomplete-event {
  background: #fffdf5;
  border: 1px solid #fde68a;
  border-radius: 1rem;
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.incomplete-event header {
  align-items: start;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}

.incomplete-event header div {
  display: grid;
  gap: 0.25rem;
}

.incomplete-event header strong {
  color: #0f172a;
}

.incomplete-event header span:not(.incomplete-badge) {
  color: #64748b;
}

.incomplete-badge {
  background: #fef3c7;
  border-radius: 999px;
  color: #92400e;
  font-size: 0.78rem;
  font-weight: 900;
  padding: 0.45rem 0.7rem;
  text-transform: uppercase;
}

.incomplete-event dl {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
}

.incomplete-event dt {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.incomplete-event dd {
  color: #0f172a;
  line-height: 1.45;
  margin: 0.25rem 0 0;
  overflow-wrap: anywhere;
}

.mono-value {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.text-link {
  color: #0f766e;
  font-weight: 900;
  justify-self: start;
  text-decoration: underline;
  text-underline-offset: 0.2rem;
}

@media (max-width: 760px) {
  .admin-card {
    border-radius: 1.25rem;
    padding: 1rem;
  }

  .section-header,
  .incomplete-event header {
    align-items: stretch;
    flex-direction: column;
  }

  .incomplete-badge {
    align-self: start;
  }

  .incomplete-event dl {
    grid-template-columns: 1fr;
  }
}
</style>
