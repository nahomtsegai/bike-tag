<script setup lang="ts">
const route = useRoute()

const referenceCode = computed(() => {
  const reference = route.query.reference

  if (typeof reference !== 'string') {
    return ''
  }

  return reference
})

const copyStatus = ref<'idle' | 'copied' | 'failed'>('idle')

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

const copyReferenceCode = async () => {
  if (!referenceCode.value) {
    return
  }

  try {
    await navigator.clipboard.writeText(referenceCode.value)

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

const copyButtonLabel = computed(() => {
  if (copyStatus.value === 'copied') {
    return 'Copied'
  }

  if (copyStatus.value === 'failed') {
    return 'Copy failed'
  }

  return 'Copy reference code'
})
</script>

<template>
  <main class="page">
    <div class="pageContent">
      <AppHeader />

      <section class="confirmationHero">
        <p class="eyebrow">Submission received</p>
        <h1 class="pageTitle">Your tag is in the review queue.</h1>
        <p class="pageIntro">
          Nice work. Your find and proposed next tag were sent to admins for
          review. The live game will stay unchanged until the submission is
          approved.
        </p>
      </section>

      <section class="confirmationCard" aria-label="Submission confirmation">
        <div class="confirmationIcon" aria-hidden="true">
          ✓
        </div>

        <div class="confirmationContent">
          <h2>Not live yet</h2>
          <p>
            The current tag stays active while admins review your match photo,
            found location, next tag photo, clue, and hidden map location.
          </p>
        </div>
      </section>

      <section
        v-if="referenceCode"
        class="referenceCard"
        aria-labelledby="referenceTitle"
      >
        <div class="referenceContent">
          <p class="eyebrow">Reference code</p>
          <h2 id="referenceTitle">Save this code to check your status.</h2>
          <p>
            You can use this reference code later to see whether your submission
            is pending, approved, or rejected.
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
        <NuxtLink to="/current-tag" class="primaryButton">
          View current tag
        </NuxtLink>

        <NuxtLink :to="submissionStatusPath" class="secondaryButton">
          Check submission status
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
.confirmationHero {
  display: grid;
  gap: 0.75rem;
  padding-top: 1.5rem;
}

.confirmationCard {
  align-items: start;
  background: var(--color-success-surface);
  border: 1px solid var(--color-success-border);
  border-radius: 1.5rem;
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
  padding: 1.25rem;
}

.confirmationIcon {
  align-items: center;
  background: var(--color-surface);
  border: 1px solid var(--color-success-border);
  border-radius: 999px;
  color: var(--color-text);
  display: inline-flex;
  font-size: 1.4rem;
  font-weight: 900;
  height: 3rem;
  justify-content: center;
  width: 3rem;
}

.confirmationContent {
  display: grid;
  gap: 0.5rem;
}

.confirmationContent h2,
.referenceContent h2,
.nextSteps h2,
.reviewNote h2 {
  color: var(--color-text);
  font-size: 1.35rem;
  line-height: 1.15;
  margin: 0;
}

.confirmationContent p,
.referenceContent p,
.reviewNote p {
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0;
}

.referenceCard,
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

.referenceCodeBox {
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  overflow-x: auto;
  padding: 1rem;
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

.referenceFeedback {
  color: var(--color-muted);
  font-size: 0.9rem;
  font-weight: 800;
  margin: 0;
}

.referenceFeedbackError {
  color: var(--color-error);
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
  .confirmationCard {
    grid-template-columns: auto 1fr;
    padding: 1.5rem;
  }

  .referenceCard,
  .nextSteps,
  .reviewNote {
    padding: 1.5rem;
  }

  .referenceActions,
  .confirmationActions {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
  }
}
</style>