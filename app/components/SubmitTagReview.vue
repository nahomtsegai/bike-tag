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

const formatCoordinate = (coordinate: number | null) => {
  if (coordinate === null) {
    return 'Not captured'
  }

  return coordinate.toFixed(6)
}

const formatAccuracy = (accuracyMeters: number | null) => {
  if (accuracyMeters === null) {
    return 'Not available'
  }

  return `${Math.round(accuracyMeters)} meters`
}

const formatCapturedAt = (capturedAt: string | null) => {
  if (!capturedAt) {
    return 'Not captured'
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(capturedAt))
}

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

const reviewRows = computed(() => {
  return [
    {
      label: 'Rider',
      value: props.form.riderName
    },
    {
      label: 'Match location source',
      value: foundLocationSource.value
    },
    {
      label: 'Match map link',
      value: props.form.foundLocationMapUrl
    },
    {
      label: 'Match latitude',
      value: formatCoordinate(props.form.foundLatitude)
    },
    {
      label: 'Match longitude',
      value: formatCoordinate(props.form.foundLongitude)
    },
    {
      label: 'Match accuracy',
      value: formatAccuracy(props.form.foundLocationAccuracyMeters)
    },
    {
      label: 'Match location captured',
      value: formatCapturedAt(props.form.foundLocationCapturedAt)
    },
    {
      label: 'Next title',
      value: props.form.nextTitle
    },
    {
      label: 'Next clue',
      value: props.form.nextClue
    },
    {
      label: 'Hidden next location source',
      value: nextHiddenLocationSource.value
    },
    {
      label: 'Hidden next map link',
      value: props.form.nextHiddenLocationMapUrl
    },
    {
      label: 'Hidden next latitude',
      value: formatCoordinate(props.form.nextHiddenLatitude)
    },
    {
      label: 'Hidden next longitude',
      value: formatCoordinate(props.form.nextHiddenLongitude)
    },
    {
      label: 'Hidden next accuracy',
      value: formatAccuracy(props.form.nextHiddenLocationAccuracyMeters)
    },
    {
      label: 'Hidden next captured',
      value: formatCapturedAt(props.form.nextHiddenLocationCapturedAt)
    }
  ]
})
</script>

<template>
  <section class="reviewPanel" aria-labelledby="submitReviewTitle">
    <div class="reviewHeader">
      <div>
        <p class="eyebrow">Review submission</p>
        <h2 id="submitReviewTitle">Make sure everything looks right.</h2>
        <p>
          Your submission will go to an admin for review before the current tag
          is marked found and the next tag becomes active.
        </p>
      </div>

      <button
        class="secondaryButton"
        type="button"
        :disabled="isSubmitting"
        @click="emit('edit')"
      >
        Edit submission
      </button>
    </div>

    <div class="reviewGrid">
      <article class="reviewCard">
        <p class="reviewCardLabel">Matching photo</p>

        <img
          v-if="matchPhotoPreviewUrl"
          :src="matchPhotoPreviewUrl"
          alt="Preview of matching tag photo"
        >

        <p v-else class="emptyPreview">No matching photo selected.</p>
      </article>

      <article class="reviewCard">
        <p class="reviewCardLabel">Next tag photo</p>

        <img
          v-if="nextPhotoPreviewUrl"
          :src="nextPhotoPreviewUrl"
          alt="Preview of next tag photo"
        >

        <p v-else class="emptyPreview">No next tag photo selected.</p>
      </article>
    </div>

    <dl class="reviewList">
      <div
        v-for="row in reviewRows"
        :key="row.label"
        class="reviewRow"
      >
        <dt>{{ row.label }}</dt>
        <dd>{{ row.value }}</dd>
      </div>
    </dl>

    <div class="reviewLinks">
      <a
        :href="form.foundLocationMapUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        Open match location
      </a>

      <a
        :href="form.nextHiddenLocationMapUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        Open hidden next location
      </a>
    </div>

    <div class="reviewActions">
      <button
        class="secondaryButton"
        type="button"
        :disabled="isSubmitting"
        @click="emit('edit')"
      >
        Back to edit
      </button>

      <button
        class="primaryButton"
        type="button"
        :disabled="isSubmitting"
        @click="emit('submit')"
      >
        {{ isSubmitting ? 'Submitting...' : 'Submit for review' }}
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

.reviewList {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  display: grid;
  gap: 0;
  margin: 0;
  overflow: hidden;
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

.reviewLinks {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.reviewLinks a {
  color: var(--color-accent);
  font-weight: 900;
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