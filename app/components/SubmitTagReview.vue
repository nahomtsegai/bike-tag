<script setup lang="ts">
type SubmitReviewForm = {
  riderName: string
  findLocationName: string
  notes: string
  nextTitle: string
  nextClue: string
  nextHiddenLocationName: string
}

defineProps<{
  form: SubmitReviewForm
  matchPhotoPreviewUrl: string | null
  nextPhotoPreviewUrl: string | null
}>()

defineEmits<{
  edit: []
  submit: []
}>()
</script>

<template>
  <section class="reviewPanel" aria-label="Review tag submission">
    <div class="reviewHeader">
      <p class="eyebrow">Review</p>
      <h2>Ready to submit?</h2>
      <p>
        Check the details before saving. The clue unlocks after 5 days, and the
        next tag location stays hidden until the tag is found.
      </p>
    </div>

    <div class="reviewGrid">
      <section class="reviewSection">
        <h3>Your find</h3>

        <dl class="reviewList">
          <div>
            <dt>Your name</dt>
            <dd>{{ form.riderName }}</dd>
          </div>

          <div>
            <dt>Found location</dt>
            <dd>{{ form.findLocationName }}</dd>
          </div>

          <div v-if="form.notes">
            <dt>Notes</dt>
            <dd>{{ form.notes }}</dd>
          </div>

          <div v-else>
            <dt>Notes</dt>
            <dd>No notes added</dd>
          </div>
        </dl>

        <div v-if="matchPhotoPreviewUrl" class="reviewPhoto">
          <img :src="matchPhotoPreviewUrl" alt="Matching tag photo preview" />
        </div>
      </section>

      <section class="reviewSection">
        <h3>Next tag</h3>

        <dl class="reviewList">
          <div>
            <dt>Title</dt>
            <dd>{{ form.nextTitle }}</dd>
          </div>

          <div>
            <dt>Hidden clue</dt>
            <dd>{{ form.nextClue }}</dd>
          </div>

          <div>
            <dt>Hidden location</dt>
            <dd>{{ form.nextHiddenLocationName }}</dd>
          </div>
        </dl>

        <div v-if="nextPhotoPreviewUrl" class="reviewPhoto">
          <img :src="nextPhotoPreviewUrl" alt="New tag photo preview" />
        </div>
      </section>
    </div>

    <div class="reviewActions">
      <button type="button" class="secondaryButton" @click="$emit('edit')">
        Edit details
      </button>

      <button type="button" class="primaryButton" @click="$emit('submit')">
        Submit tag
      </button>
    </div>
  </section>
</template>

<style scoped>
.reviewPanel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  display: grid;
  gap: 1.25rem;
  margin-top: 1.5rem;
  padding: 1.25rem;
}

.reviewHeader {
  display: grid;
  gap: 0.5rem;
}

.reviewHeader h2 {
  color: var(--color-text);
  font-size: 1.75rem;
  line-height: 1.1;
  margin: 0;
}

.reviewHeader p {
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0;
}

.reviewGrid {
  display: grid;
  gap: 1rem;
}

.reviewSection {
  border: 1px solid var(--color-border);
  border-radius: 1.25rem;
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.reviewSection h3 {
  color: var(--color-text);
  font-size: 1.25rem;
  margin: 0;
}

.reviewList {
  display: grid;
  gap: 0.9rem;
  margin: 0;
}

.reviewList div {
  display: grid;
  gap: 0.25rem;
}

dt {
  color: var(--color-text);
  font-size: 0.8rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

dd {
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0;
  overflow-wrap: anywhere;
}

.reviewPhoto {
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  overflow: hidden;
}

.reviewPhoto img {
  display: block;
  max-height: 280px;
  object-fit: cover;
  width: 100%;
}

.reviewActions {
  display: grid;
  gap: 0.75rem;
}

@media (min-width: 760px) {
  .reviewPanel {
    padding: 1.5rem;
  }

  .reviewGrid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .reviewActions {
    display: flex;
    justify-content: flex-end;
  }
}
</style>