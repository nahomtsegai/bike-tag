<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { useSubmissionStatusLookup } from '../composables/useSubmissionStatusLookup'
import {
  clearLatestSubmissionReference,
  getLatestSubmissionReference
} from '../utils/latestSubmissionReferenceStorage'

const {
  referenceCode,
  submissionStatus,
  lookupError,
  isLoading,
  canSubmitLookup,
  statusLabel,
  statusDescription,
  formatDate,
  clearLookupFeedback,
  checkSubmissionStatus
} = useSubmissionStatusLookup()

const latestSubmissionReference = ref('')

const latestSubmissionStatusPath = computed(() => {
  if (!latestSubmissionReference.value) {
    return '/submission-status'
  }

  return {
    path: '/submission-status',
    query: {
      reference: latestSubmissionReference.value
    }
  }
})

const shouldShowLatestSubmissionShortcut = computed(() => {
  if (!latestSubmissionReference.value) {
    return false
  }

  return latestSubmissionReference.value !== referenceCode.value.trim()
})

const clearLatestSubmissionShortcut = () => {
  clearLatestSubmissionReference()
  latestSubmissionReference.value = ''
}

onMounted(() => {
  latestSubmissionReference.value = getLatestSubmissionReference()
})

const statusNextStepTitle = computed(() => {
  if (!submissionStatus.value) {
    return ''
  }

  if (submissionStatus.value.status === 'pending') {
    return 'Your submission is waiting for review.'
  }

  if (submissionStatus.value.status === 'approved') {
    return 'Your tag was approved.'
  }

  if (submissionStatus.value.status === 'rejected') {
    return 'Your submission needs another try.'
  }

  return 'Submission status updated.'
})

const statusNextStepDescription = computed(() => {
  if (!submissionStatus.value) {
    return ''
  }

  if (submissionStatus.value.status === 'pending') {
    return 'The current tag stays active while admins check your match photo, found location, next tag photo, clue, and hidden location.'
  }

  if (submissionStatus.value.status === 'approved') {
    return 'Nice work. Your find was accepted, and your next mystery spot can become part of the live game.'
  }

  if (submissionStatus.value.status === 'rejected') {
    return 'Check the review note if one was added. You can return to the current tag and submit a clearer match or next tag.'
  }

  return 'Use the details below to see what happened with your submission.'
})

const statusActionPath = computed(() => {
  if (!submissionStatus.value) {
    return '/current-tag'
  }

  if (submissionStatus.value.status === 'approved') {
    return '/current-tag'
  }

  if (submissionStatus.value.status === 'rejected') {
    return '/submit'
  }

  return '/current-tag'
})

const statusActionLabel = computed(() => {
  if (!submissionStatus.value) {
    return 'View current tag'
  }

  if (submissionStatus.value.status === 'approved') {
    return 'View current tag'
  }

  if (submissionStatus.value.status === 'rejected') {
    return 'Submit another tag'
  }

  return 'View current tag'
})
</script>

<template>
  <main class="page">
    <div class="pageContent">
      <AppHeader />

      <section class="pageHero">
        <p class="eyebrow">Submission status</p>
        <h1 class="pageTitle">Check your Bike Tag submission.</h1>
        <p class="pageIntro">
          Enter your reference code to see whether your submission is pending,
          approved, or rejected.
        </p>
      </section>

      <section class="statusLookupCard" aria-labelledby="statusLookupTitle">
        <div class="sectionIntro">
          <p class="sectionStep">Lookup</p>
          <h2 id="statusLookupTitle">Enter your reference code</h2>
          <p>
            You can find this code on the submission success screen after sending
            your tag for admin review.
          </p>
        </div>

        <form class="lookupForm" @submit.prevent="checkSubmissionStatus">
          <div class="fieldGroup">
            <label for="referenceCode">Submission reference code</label>

            <input
              id="referenceCode"
              v-model="referenceCode"
              type="text"
              placeholder="Example: 123e4567-e89b-42d3-a456-426614174000"
              :aria-invalid="Boolean(lookupError)"
              aria-describedby="referenceCodeHelp referenceCodeError"
              @input="clearLookupFeedback"
            >

            <p id="referenceCodeHelp" class="fieldHelp">
              This is the unique code for your submission.
            </p>

            <p
              v-if="lookupError"
              id="referenceCodeError"
              class="errorMessage"
              role="alert"
            >
              {{ lookupError }}
            </p>
          </div>

          <button
            class="primaryButton lookupButton"
            type="submit"
            :disabled="!canSubmitLookup"
          >
            {{ isLoading ? 'Checking status...' : 'Check status' }}
          </button>
        </form>
      </section>

      <section
        v-if="shouldShowLatestSubmissionShortcut"
        class="latestSubmissionCard"
        aria-labelledby="latestSubmissionTitle"
      >
        <div>
          <p class="sectionStep">Saved on this device</p>
          <h2 id="latestSubmissionTitle">Check your latest submission</h2>
          <p>
            This browser has a saved reference from your most recent submission.
            You can open it directly or clear the saved shortcut.
          </p>
        </div>

        <div class="latestSubmissionReference">
          <span>Reference code</span>
          <code>{{ latestSubmissionReference }}</code>
        </div>

        <div class="latestSubmissionActions">
          <NuxtLink :to="latestSubmissionStatusPath" class="primaryButton">
            Check latest submission
          </NuxtLink>

          <button
            class="secondaryButton"
            type="button"
            @click="clearLatestSubmissionShortcut"
          >
            Clear saved shortcut
          </button>
        </div>
      </section>

      <section
        v-if="submissionStatus"
        class="statusResultCard"
        aria-labelledby="statusResultTitle"
      >
        <div class="statusResultHeader">
          <p class="eyebrow">Current status</p>
          <h2 id="statusResultTitle">{{ statusLabel }}</h2>
          <p>{{ statusDescription }}</p>
        </div>

        <section class="nextStepCard" aria-labelledby="statusNextStepTitle">
          <div>
            <p class="sectionStep">What this means</p>
            <h3 id="statusNextStepTitle">{{ statusNextStepTitle }}</h3>
            <p>{{ statusNextStepDescription }}</p>
          </div>

          <NuxtLink :to="statusActionPath" class="primaryButton">
            {{ statusActionLabel }}
          </NuxtLink>
        </section>

        <dl class="statusDetails">
          <div>
            <dt>Rider</dt>
            <dd>{{ submissionStatus.riderName }}</dd>
          </div>

          <div>
            <dt>Next tag title</dt>
            <dd>{{ submissionStatus.nextTitle }}</dd>
          </div>

          <div>
            <dt>Submitted</dt>
            <dd>{{ formatDate(submissionStatus.submittedAt) }}</dd>
          </div>

          <div>
            <dt>Reviewed</dt>
            <dd>{{ formatDate(submissionStatus.reviewedAt) }}</dd>
          </div>

          <div v-if="submissionStatus.reviewNote" class="reviewNoteDetail">
            <dt>Review note</dt>
            <dd>{{ submissionStatus.reviewNote }}</dd>
          </div>
        </dl>
      </section>

      <section
        v-else
        class="emptyStatusCard"
        aria-labelledby="emptyStatusTitle"
      >
        <p class="sectionStep">Need the code?</p>
        <h2 id="emptyStatusTitle">Your reference code appears after submitting.</h2>
        <p>
          If you just submitted a tag, check the success page or any saved copy
          of your reference code. Without that code, admins can still review your
          submission, but this page cannot look it up.
        </p>

        <div class="emptyStatusActions">
          <NuxtLink to="/submit" class="secondaryButton">
            Submit a tag
          </NuxtLink>

          <NuxtLink to="/current-tag" class="secondaryButton">
            View current tag
          </NuxtLink>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.statusLookupCard,
.statusResultCard,
.emptyStatusCard,
.latestSubmissionCard {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  display: grid;
  gap: 1.25rem;
  margin-top: 1.5rem;
  padding: 1.25rem;
}

.sectionIntro,
.statusResultHeader,
.emptyStatusCard {
  display: grid;
  gap: 0.4rem;
}

.sectionStep {
  color: var(--color-accent);
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  margin: 0;
  text-transform: uppercase;
}

.sectionIntro h2,
.statusResultHeader h2,
.emptyStatusCard h2 {
  color: var(--color-text);
  font-size: 1.45rem;
  line-height: 1.15;
  margin: 0;
}

.sectionIntro p,
.statusResultHeader p,
.emptyStatusCard p {
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0;
}

.lookupForm {
  display: grid;
  gap: 1rem;
}

.fieldGroup {
  display: grid;
  gap: 0.45rem;
}

label {
  color: var(--color-text);
  font-size: 0.95rem;
  font-weight: 900;
}

input {
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: 1rem;
  color: var(--color-text);
  font-size: 1rem;
  line-height: 1.4;
  min-height: 3.25rem;
  padding: 0.95rem 1rem;
  width: 100%;
}

input::placeholder {
  color: var(--color-subtle);
}

input:focus {
  border-color: var(--color-primary);
  outline: 3px solid var(--color-focus);
}

input[aria-invalid='true'] {
  border-color: var(--color-error);
}

.fieldHelp {
  color: var(--color-subtle);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
}

.errorMessage {
  color: var(--color-error);
  font-size: 0.9rem;
  font-weight: 700;
  margin: 0;
}

.lookupButton {
  min-height: 3.25rem;
  width: 100%;
}

.lookupButton:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.statusDetails {
  display: grid;
  gap: 0.75rem;
  margin: 0;
}

.statusDetails div {
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  display: grid;
  gap: 0.25rem;
  padding: 1rem;
}

.statusDetails dt {
  color: var(--color-muted);
  font-size: 0.8rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.statusDetails dd {
  color: var(--color-text);
  font-weight: 800;
  margin: 0;
  overflow-wrap: anywhere;
}

.nextStepCard {
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.nextStepCard h3 {
  color: var(--color-text);
  font-size: 1.2rem;
  line-height: 1.15;
  margin: 0.35rem 0 0;
}

.nextStepCard p {
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0.5rem 0 0;
}

.nextStepCard .primaryButton {
  align-items: center;
  display: inline-flex;
  justify-content: center;
  width: 100%;
}

.reviewNoteDetail {
  grid-column: 1 / -1;
}

.emptyStatusActions {
  display: grid;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.emptyStatusActions .secondaryButton {
  align-items: center;
  display: inline-flex;
  justify-content: center;
  width: 100%;
}

.latestSubmissionCard {
  background: var(--color-surface-soft);
  border-color: var(--color-primary);
}

.latestSubmissionCard div {
  display: grid;
  gap: 0.4rem;
}

.latestSubmissionReference {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 1rem;
}

.latestSubmissionReference span {
  color: var(--color-muted);
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.latestSubmissionReference code {
  color: var(--color-text);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.95rem;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.latestSubmissionActions {
  display: grid;
  gap: 0.75rem;
}

.latestSubmissionActions .primaryButton,
.latestSubmissionActions .secondaryButton {
  align-items: center;
  display: inline-flex;
  justify-content: center;
  width: 100%;
}

@media (min-width: 760px) {
  .statusLookupCard,
  .statusResultCard,
  .emptyStatusCard,
  .latestSubmissionCard {
    padding: 1.5rem;
  }

  .lookupForm {
    align-items: start;
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .lookupButton {
    margin-top: 1.85rem;
    width: auto;
  }

  .nextStepCard {
    align-items: center;
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .nextStepCard .primaryButton {
    width: auto;
  }

  .statusDetails {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .emptyStatusActions {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
  }

  .emptyStatusActions .secondaryButton {
    width: auto;
  }

  .latestSubmissionCard {
    align-items: center;
    grid-template-columns: minmax(0, 1fr) minmax(16rem, 0.7fr);
  }

  .latestSubmissionActions {
    grid-column: 1 / -1;
  }

  .latestSubmissionActions .primaryButton,
  .latestSubmissionActions .secondaryButton {
    width: auto;
  }
}
</style>