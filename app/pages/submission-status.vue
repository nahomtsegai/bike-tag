<script setup lang="ts">
import { useSubmissionStatusLookup } from '../composables/useSubmissionStatusLookup'

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
</script>

<template>
  <main class="page">
    <div class="pageContent">
      <AppHeader />

      <section class="pageHero">
        <p class="eyebrow">Submission status</p>
        <h1 class="pageTitle">Check your Bike Tag submission.</h1>
        <p class="pageIntro">
          Paste your submission reference code to see whether your tag is still
          pending, approved, or rejected.
        </p>
      </section>

      <section class="statusLookupCard" aria-labelledby="statusLookupTitle">
        <div class="sectionIntro">
          <p class="sectionStep">Lookup</p>
          <h2 id="statusLookupTitle">Enter your reference code</h2>
          <p>
            You can find this code on the submission success screen after sending
            your tag to the admins.
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
              The reference code is the unique ID for your submission.
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
        v-if="submissionStatus"
        class="statusResultCard"
        aria-labelledby="statusResultTitle"
      >
        <div class="statusResultHeader">
          <p class="eyebrow">Current status</p>
          <h2 id="statusResultTitle">{{ statusLabel }}</h2>
          <p>{{ statusDescription }}</p>
        </div>

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

          <div v-if="submissionStatus.reviewNote">
            <dt>Review note</dt>
            <dd>{{ submissionStatus.reviewNote }}</dd>
          </div>
        </dl>
      </section>
    </div>
  </main>
</template>

<style scoped>
.statusLookupCard,
.statusResultCard {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  display: grid;
  gap: 1.25rem;
  margin-top: 1.5rem;
  padding: 1.25rem;
}

.sectionIntro {
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
.statusResultHeader h2 {
  color: var(--color-text);
  font-size: 1.45rem;
  line-height: 1.15;
  margin: 0;
}

.sectionIntro p,
.statusResultHeader p {
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

.statusResultHeader {
  display: grid;
  gap: 0.45rem;
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

@media (min-width: 760px) {
  .statusLookupCard,
  .statusResultCard {
    padding: 1.5rem;
  }

  .lookupForm {
    align-items: end;
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .lookupButton {
    width: auto;
  }

  .statusDetails {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>