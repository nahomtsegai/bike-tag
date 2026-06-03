<script setup lang="ts">
import { onMounted } from 'vue'

import { saveLatestSubmissionReference } from '../../utils/latestSubmissionReferenceStorage'
import { buildSubmissionStatusUrl } from '../../utils/submissionStatusLink'

const route = useRoute()

const referenceCode = computed(() => {
  const reference = route.query.reference

  if (typeof reference !== 'string') {
    return ''
  }

  return reference
})

const copyStatus = ref<'idle' | 'copied' | 'failed'>('idle')
const copyStatusLinkStatus = ref<'idle' | 'copied' | 'failed'>('idle')

const submissionStatusPath = computed(() => {
  if (!referenceCode.value) {
    return '/submission-status'
  }

  return {
    path: '/submission-status',
    query: {
      reference: referenceCode.value
    }
  }
})

const submissionStatusUrl = computed(() => {
  if (!referenceCode.value) {
    return ''
  }

  if (!import.meta.client) {
    return buildSubmissionStatusUrl(referenceCode.value)
  }

  return buildSubmissionStatusUrl(referenceCode.value, window.location.origin)
})

onMounted(() => {
  if (!referenceCode.value) {
    return
  }

  saveLatestSubmissionReference(referenceCode.value)
})

const copyTextWithFallback = (text: string) => {
  const textarea = document.createElement('textarea')

  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.top = '-9999px'
  textarea.style.left = '-9999px'

  document.body.appendChild(textarea)
  textarea.select()
  textarea.setSelectionRange(0, textarea.value.length)

  const didCopy = document.execCommand('copy')

  document.body.removeChild(textarea)

  if (!didCopy) {
    throw new Error('Fallback copy failed.')
  }
}

const copyReferenceCode = async () => {
  if (!referenceCode.value) {
    return
  }

  try {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(referenceCode.value)
    } else {
      copyTextWithFallback(referenceCode.value)
    }

    copyStatus.value = 'copied'

    window.setTimeout(() => {
      if (copyStatus.value === 'copied') {
        copyStatus.value = 'idle'
      }
    }, 3000)
  } catch (error) {
    copyStatus.value = 'failed'

    window.setTimeout(() => {
      if (copyStatus.value === 'failed') {
        copyStatus.value = 'idle'
      }
    }, 3000)

    console.error(error)
  }
}

const copyStatusLink = async () => {
  if (!submissionStatusUrl.value) {
    return
  }

  try {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(submissionStatusUrl.value)
    } else {
      copyTextWithFallback(submissionStatusUrl.value)
    }

    copyStatusLinkStatus.value = 'copied'

    window.setTimeout(() => {
      if (copyStatusLinkStatus.value === 'copied') {
        copyStatusLinkStatus.value = 'idle'
      }
    }, 3000)
  } catch (error) {
    copyStatusLinkStatus.value = 'failed'

    window.setTimeout(() => {
      if (copyStatusLinkStatus.value === 'failed') {
        copyStatusLinkStatus.value = 'idle'
      }
    }, 3000)

    console.error(error)
  }
}

const copyButtonLabel = computed(() => {
  if (copyStatus.value === 'copied') {
    return 'Copied'
  }

  if (copyStatus.value === 'failed') {
    return 'Copy failed'
  }

  return 'Copy reference code'
})

const copyStatusLinkButtonLabel = computed(() => {
  if (copyStatusLinkStatus.value === 'copied') {
    return 'Status link copied'
  }

  if (copyStatusLinkStatus.value === 'failed') {
    return 'Copy failed'
  }

  return 'Copy status link'
})
</script>

<template>
  <main class="page">
    <div class="pageContent">
      <AppHeader />

      <section class="successHero" aria-labelledby="successTitle">
        <div class="successIcon" aria-hidden="true">
          ✓
        </div>

        <p class="eyebrow">Submission received</p>

        <h1 id="successTitle" class="pageTitle">
          Your tag is in the review queue.
        </h1>

        <p class="pageIntro">
          Nice work. Your find is waiting for admin review. If approved, your next
          mystery spot becomes the new current tag.
        </p>

        <div class="successActions">
          <NuxtLink :to="submissionStatusPath" class="primaryButton">
            Check submission status
          </NuxtLink>

          <NuxtLink to="/current-tag" class="secondaryButton">
            View current tag
          </NuxtLink>
        </div>
      </section>

      <section
        v-if="referenceCode"
        class="referenceCard"
        aria-labelledby="referenceTitle"
      >
        <div class="referenceContent">
          <p class="eyebrow">Save this</p>
          <h2 id="referenceTitle">Your submission reference code</h2>
          <p>
            Use this code or status link to check whether your submission is
            pending, approved, or rejected.
          </p>
        </div>

        <div class="referenceCodeBox">
          <code>{{ referenceCode }}</code>
        </div>

        <div class="referenceActions">
          <button
            class="secondaryButton"
            type="button"
            @click="copyReferenceCode"
          >
            {{ copyButtonLabel }}
          </button>

          <button
            class="secondaryButton"
            type="button"
            @click="copyStatusLink"
          >
            {{ copyStatusLinkButtonLabel }}
          </button>

          <NuxtLink :to="submissionStatusPath" class="primaryButton">
            Check status
          </NuxtLink>
        </div>

        <p
          v-if="copyStatus === 'copied'"
          class="referenceFeedback"
          role="status"
        >
          Reference code copied.
        </p>

        <p
          v-if="copyStatus === 'failed'"
          class="referenceFeedback referenceFeedbackError"
          role="alert"
        >
          Could not copy the reference code. You can copy it manually.
        </p>

        <p
          v-if="copyStatusLinkStatus === 'copied'"
          class="referenceFeedback"
          role="status"
        >
          Status link copied.
        </p>

        <p
          v-if="copyStatusLinkStatus === 'failed'"
          class="referenceFeedback referenceFeedbackError"
          role="alert"
        >
          Could not copy the status link. You can open the status page and copy
          the URL manually.
        </p>
      </section>

      <section class="notLiveCard" aria-label="Submission is not live yet">
        <div class="notLiveIcon" aria-hidden="true">
          ⏳
        </div>

        <div class="notLiveContent">
          <h2>Not live yet</h2>
          <p>
            The current tag stays active while admins review your match photo,
            found location, next mystery photo, clue, and hidden location.
          </p>
        </div>
      </section>

      <section class="nextSteps" aria-label="What happens next">
        <h2>What happens next?</h2>

        <ol>
          <li>An admin reviews your match photo and found location.</li>
          <li>The admin checks the proposed next tag details.</li>
          <li>If approved, your submission becomes the next active tag.</li>
          <li>If rejected, the current tag stays unchanged.</li>
        </ol>
      </section>

      <section class="reviewNote" aria-label="Review reminder">
        <h2>While you wait</h2>
        <p>
          You can keep playing from the current tag page. Approved submissions
          will appear in the game after admin review.
        </p>
      </section>

      <nav class="confirmationActions" aria-label="Submission next actions">
        <NuxtLink :to="submissionStatusPath" class="primaryButton">
          Check submission status
        </NuxtLink>

        <NuxtLink to="/current-tag" class="secondaryButton">
          View current tag
        </NuxtLink>

        <NuxtLink to="/tags" class="secondaryButton">
          View found tags
        </NuxtLink>

        <NuxtLink to="/rules" class="secondaryButton">
          Read rules
        </NuxtLink>

        <NuxtLink to="/submit" class="secondaryButton">
          Submit another tag
        </NuxtLink>
      </nav>
    </div>
  </main>
</template>

<style scoped>
.successHero {
  background: linear-gradient(
    135deg,
    var(--color-success-surface),
    var(--color-surface)
  );
  border: 1px solid var(--color-success-border);
  border-radius: 2rem;
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
  padding: 1.5rem;
  text-align: left;
}

.successIcon {
  align-items: center;
  background: var(--color-surface);
  border: 2px solid var(--color-success-border);
  border-radius: 999px;
  box-shadow: 0 16px 40px rgb(0 0 0 / 0.12);
  color: var(--color-text);
  display: inline-flex;
  font-size: 2rem;
  font-weight: 900;
  height: 4rem;
  justify-content: center;
  width: 4rem;
}

.successActions {
  display: grid;
  gap: 0.75rem;
  margin-top: 0.25rem;
}

.referenceCard,
.notLiveCard,
.nextSteps,
.reviewNote {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
  padding: 1.25rem;
}

.referenceCard {
  border-color: var(--color-primary);
}

.referenceContent {
  display: grid;
  gap: 0.5rem;
}

.referenceContent h2,
.notLiveContent h2,
.nextSteps h2,
.reviewNote h2 {
  color: var(--color-text);
  font-size: 1.35rem;
  font-weight: 750;
  line-height: 1.15;
  margin: 0;
}

.referenceContent p,
.notLiveContent p,
.reviewNote p {
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0;
}

.referenceCodeBox code {
  color: var(--color-text);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.95rem;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.referenceActions {
  display: grid;
  gap: 0.75rem;
}

.referenceActions .primaryButton,
.referenceActions .secondaryButton {
  font-weight: 750;
}

.referenceFeedback {
  color: var(--color-muted);
  font-size: 0.9rem;
  font-weight: 800;
  margin: 0;
}

.referenceFeedbackError {
  color: var(--color-error);
}

.notLiveCard {
  align-items: start;
  background: var(--color-warning-surface);
  border-color: var(--color-warning-border);
}

.notLiveIcon {
  align-items: center;
  background: var(--color-surface);
  border: 1px solid var(--color-warning-border);
  border-radius: 999px;
  display: inline-flex;
  font-size: 1.5rem;
  height: 3.25rem;
  justify-content: center;
  width: 3.25rem;
}

.notLiveContent {
  display: grid;
  gap: 0.5rem;
}

.nextSteps ol {
  color: var(--color-muted);
  display: grid;
  gap: 0.65rem;
  line-height: 1.6;
  margin: 0;
  padding-left: 1.25rem;
}

.confirmationActions {
  display: grid;
  gap: 0.75rem;
  margin-top: 1rem;
}

@media (min-width: 700px) {
  .successHero {
    padding: 2rem;
  }

  .successActions,
  .referenceActions,
  .confirmationActions {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
  }

  .referenceCard,
  .notLiveCard,
  .nextSteps,
  .reviewNote {
    padding: 1.5rem;
  }

  .notLiveCard {
    grid-template-columns: auto 1fr;
  }
}
</style>