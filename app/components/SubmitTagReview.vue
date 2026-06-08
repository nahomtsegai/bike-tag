<script setup lang="ts">
type SubmitTagReviewForm = {
  riderName: string
  foundLocationMapUrl: string
  foundLatitude: number | null
  foundLongitude: number | null
  foundLocationAccuracyMeters: number | null
  foundLocationCapturedAt: string | null
  matchPhoto: File | null
  nextTitle: string
  nextClue: string
  nextHiddenLocationMapUrl: string
  nextHiddenLatitude: number | null
  nextHiddenLongitude: number | null
  nextHiddenLocationAccuracyMeters: number | null
  nextHiddenLocationCapturedAt: string | null
  nextPhoto: File | null
}

const props = defineProps<{
  form: SubmitTagReviewForm
  matchPhotoPreviewUrl: string | null
  nextPhotoPreviewUrl: string | null
  isSubmitting: boolean
}>()

const emit = defineEmits<{
  edit: []
  submit: []
}>()

const foundLocationSource = computed(() => {
  if (
    props.form.foundLatitude !== null &&
    props.form.foundLongitude !== null &&
    props.form.foundLocationCapturedAt
  ) {
    return 'Current location'
  }

  return 'Manual map link'
})

const nextHiddenLocationSource = computed(() => {
  if (
    props.form.nextHiddenLatitude !== null &&
    props.form.nextHiddenLongitude !== null &&
    props.form.nextHiddenLocationCapturedAt
  ) {
    return 'Current location'
  }

  return 'Manual map link'
})

const isNextHiddenLocationMissing = computed(() => {
  return (
    props.form.nextHiddenLatitude === null ||
    props.form.nextHiddenLongitude === null ||
    props.form.nextHiddenLocationAccuracyMeters === null ||
    !props.form.nextHiddenLocationCapturedAt
  )
})

const canSubmit = computed(() => {
  return !props.isSubmitting
})

const editButtonLabel = computed(() => {
  if (props.isSubmitting) {
    return 'Submitting now'
  }

  return 'Edit submission'
})

const backButtonLabel = computed(() => {
  if (props.isSubmitting) {
    return 'Submitting now'
  }

  return 'Back to edit'
})

const submitButtonLabel = computed(() => {
  if (props.isSubmitting) {
    return 'Sending to admins...'
  }

  return 'Submit for review'
})

const findReviewRows = computed(() => {
  return [
    {
      label: 'Rider',
      value: props.form.riderName
    },
    {
      label: 'Location source',
      value: foundLocationSource.value
    },
    {
      label: 'Match map link',
      value: props.form.foundLocationMapUrl
    }
  ]
})

const nextTagReviewRows = computed(() => {
  return [
    {
      label: 'Next title',
      value: props.form.nextTitle
    },
    {
      label: 'Hidden clue',
      value: props.form.nextClue
    },
    {
      label: 'Hidden location source',
      value: nextHiddenLocationSource.value
    },
    {
      label: 'Hidden map link',
      value: props.form.nextHiddenLocationMapUrl || 'Not captured'
    }
  ]
})
</script>

<template>
  <section
    class="reviewPanel"
    aria-labelledby="submitReviewTitle"
    :aria-busy="isSubmitting"
  >
    <div class="reviewHeader">
      <div>
        <p class="eyebrow">Before you submit</p>
        <h2 id="submitReviewTitle">Review your find and next mystery spot.</h2>
        <p>
          Your match photo, found location, next tag photo, clue, and hidden
          location will go to an admin. If approved, your next mystery spot
          becomes the new current tag.
        </p>
      </div>

      <button
        class="secondaryButton"
        type="button"
        :disabled="isSubmitting"
        @click="emit('edit')"
      >
        {{ editButtonLabel }}
      </button>
    </div>

    <div
      v-if="isSubmitting"
      class="reviewStatusBanner"
      role="status"
      aria-live="polite"
    >
      Sending your submission to admins. Please keep this page open.
    </div>

    <div class="reviewGrid">
      <article class="reviewCard">
        <div>
          <p class="reviewCardLabel">Your find</p>
          <h3>Matching photo</h3>
        </div>

        <img
          v-if="matchPhotoPreviewUrl"
          :src="matchPhotoPreviewUrl"
          alt="Preview of matching tag photo"
        >

        <p v-else class="emptyPreview">No matching photo selected.</p>
      </article>

      <article class="reviewCard">
        <div>
          <p class="reviewCardLabel">Next hunt</p>
          <h3>Next tag photo</h3>
        </div>

        <img
          v-if="nextPhotoPreviewUrl"
          :src="nextPhotoPreviewUrl"
          alt="Preview of next tag photo"
        >

        <p v-else class="emptyPreview">No next tag photo selected.</p>
      </article>
    </div>

    <div class="reviewSections">
      <section class="reviewSection" aria-labelledby="findReviewTitle">
        <div class="reviewSectionHeader">
          <p class="eyebrow">Step 1</p>
          <h3 id="findReviewTitle">Your find</h3>
          <p>This proves you found the current tag.</p>
        </div>

        <dl class="reviewList">
          <div
            v-for="row in findReviewRows"
            :key="row.label"
            class="reviewRow"
          >
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>
      </section>

      <section class="reviewSection" aria-labelledby="nextTagReviewTitle">
        <div class="reviewSectionHeader">
          <p class="eyebrow">Step 2</p>
          <h3 id="nextTagReviewTitle">Next tag</h3>
          <p>This is what riders will chase if your submission is approved.</p>
        </div>

        <dl class="reviewList">
          <div
            v-for="row in nextTagReviewRows"
            :key="row.label"
            class="reviewRow"
          >
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>
      </section>
    </div>

    <div
      v-if="isNextHiddenLocationMissing"
      class="reviewNote"
    >
      <strong>Manual hidden location provided.</strong>
      <span>
        GPS details were not captured, so admins will verify the pasted map link.
      </span>
    </div>

    <div class="reviewLinks">
      <a
        :href="form.foundLocationMapUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        Open match location
      </a>

      <a
        v-if="form.nextHiddenLocationMapUrl"
        :href="form.nextHiddenLocationMapUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        Open hidden next location
      </a>
    </div>

    <div class="reviewSubmitNote">
      <h3>Ready to send?</h3>
      <p>
        After you submit, the current tag stays active until an admin approves
        this find.
      </p>
    </div>

    <div class="reviewActions">
      <button
        class="secondaryButton"
        type="button"
        :disabled="isSubmitting"
        @click="emit('edit')"
      >
        {{ backButtonLabel }}
      </button>

      <button
        class="primaryButton"
        type="button"
        :disabled="!canSubmit"
        @click="emit('submit')"
      >
        {{ submitButtonLabel }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.reviewPanel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  box-shadow: var(--shadow-soft);
  display: grid;
  gap: 1.5rem;
  padding: 1.25rem;
}

.reviewHeader {
  display: grid;
  gap: 1rem;
}

.reviewHeader h2 {
  color: var(--color-text);
  font-size: clamp(1.8rem, 6vw, 3rem);
  line-height: 1.05;
  margin: 0;
}

.reviewHeader p {
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0.75rem 0 0;
}

.reviewHeader .secondaryButton {
  justify-self: start;
}

.reviewStatusBanner {
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  color: var(--color-text);
  font-weight: 800;
  line-height: 1.6;
  padding: 1rem;
}

.reviewGrid {
  display: grid;
  gap: 1rem;
}

.reviewCard {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  display: grid;
  gap: 0.75rem;
  overflow: hidden;
  padding: 1rem;
}

.reviewCardLabel {
  color: var(--color-muted);
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  margin: 0;
  text-transform: uppercase;
}

.reviewCard h3 {
  color: var(--color-text);
  font-size: 1.15rem;
  line-height: 1.15;
  margin: 0.3rem 0 0;
}

.reviewCard img {
  aspect-ratio: 4 / 3;
  border-radius: 0.85rem;
  display: block;
  object-fit: cover;
  width: 100%;
}

.emptyPreview {
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0;
}

.reviewSections {
  display: grid;
  gap: 1rem;
}

.reviewSection {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  overflow: hidden;
}

.reviewSectionHeader {
  display: grid;
  gap: 0.4rem;
  padding: 1rem;
}

.reviewSectionHeader h3 {
  color: var(--color-text);
  font-size: 1.2rem;
  line-height: 1.15;
  margin: 0;
}

.reviewSectionHeader p {
  color: var(--color-muted);
  line-height: 1.55;
  margin: 0;
}

.reviewList {
  border-top: 1px solid var(--color-border);
  display: grid;
  gap: 0;
  margin: 0;
}

.reviewRow {
  display: grid;
  gap: 0.35rem;
  padding: 1rem;
}

.reviewRow + .reviewRow {
  border-top: 1px solid var(--color-border);
}

.reviewRow dt {
  color: var(--color-muted);
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.reviewRow dd {
  color: var(--color-text);
  line-height: 1.5;
  margin: 0;
  overflow-wrap: anywhere;
}

.reviewNote {
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  color: var(--color-text);
  display: grid;
  gap: 0.35rem;
  line-height: 1.55;
  padding: 1rem;
}

.reviewNote strong {
  font-size: 0.98rem;
}

.reviewNote span {
  color: var(--color-muted);
}

.reviewLinks {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.reviewLinks a {
  color: var(--color-accent);
  font-weight: 900;
}

.reviewSubmitNote {
  background: var(--color-success-surface);
  border: 1px solid var(--color-success-border);
  border-radius: 1rem;
  display: grid;
  gap: 0.4rem;
  padding: 1rem;
}

.reviewSubmitNote h3 {
  color: var(--color-text);
  font-size: 1.1rem;
  line-height: 1.15;
  margin: 0;
}

.reviewSubmitNote p {
  color: var(--color-muted);
  line-height: 1.55;
  margin: 0;
}

.reviewActions {
  display: grid;
  gap: 0.75rem;
}

@media (min-width: 720px) {
  .reviewPanel {
    padding: 1.5rem;
  }

  .reviewHeader {
    align-items: start;
    grid-template-columns: 1fr auto;
  }

  .reviewGrid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .reviewRow {
    grid-template-columns: 220px 1fr;
  }

  .reviewActions {
    align-items: center;
    display: flex;
    justify-content: flex-end;
  }
}
</style>