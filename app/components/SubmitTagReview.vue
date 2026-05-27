<script setup lang="ts">
type SubmitReviewForm = {
  riderName: string
  findLocationMapUrl: string
  notes: string
  nextTitle: string
  nextClue: string
  nextHiddenLocationMapUrl: string
}

defineProps<{
  form: SubmitReviewForm
  matchPhotoPreviewUrl: string | null
  nextPhotoPreviewUrl: string | null
  isSubmitting: boolean
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
      <h2>Review before submitting</h2>
      <p>
        Check everything carefully before sending this to admin review. The
        current tag will not change until an admin approves the submission.
      </p>
    </div>

    <div class="reviewNotice" role="status">
      <strong>Not live yet</strong>
      <p>
        Submitting sends this tag to the review queue. The clue and hidden map
        location stay private, and the current tag remains active until approval.
      </p>
    </div>

    <div class="reviewGrid">
      <section class="reviewSection">
        <div class="sectionHeading">
          <p class="sectionKicker">Proof</p>
          <h3>Your find</h3>
        </div>

        <dl class="reviewList">
          <div>
            <dt>Rider name</dt>
            <dd>{{ form.riderName }}</dd>
          </div>

          <div>
            <dt>Found location</dt>
            <dd>
              <a
                :href="form.findLocationMapUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open found map link
              </a>
            </dd>
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

        <div v-if="matchPhotoPreviewUrl" class="reviewPhotoBlock">
          <p class="photoLabel">Match photo</p>
          <div class="reviewPhoto">
            <img :src="matchPhotoPreviewUrl" alt="Matching tag photo preview" />
          </div>
        </div>
      </section>

      <section class="reviewSection">
        <div class="sectionHeading">
          <p class="sectionKicker">Next mystery spot</p>
          <h3>Next tag</h3>
        </div>

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
            <dd>
              <a
                :href="form.nextHiddenLocationMapUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open hidden map link
              </a>
            </dd>
          </div>
        </dl>

        <div v-if="nextPhotoPreviewUrl" class="reviewPhotoBlock">
          <p class="photoLabel">Next tag photo</p>
          <div class="reviewPhoto">
            <img :src="nextPhotoPreviewUrl" alt="New tag photo preview" />
          </div>
        </div>
      </section>
    </div>

    <div class="reviewSubmitReminder">
      <strong>Ready to send?</strong>
      <p>
        Once submitted, this goes to the admin review queue. The current tag
        stays active until an admin approves it.
      </p>
    </div>

    <div class="reviewActions">
      <button
        type="button"
        class="secondaryButton"
        :disabled="isSubmitting"
        @click="$emit('edit')"
      >
        {{ isSubmitting ? 'Submitting...' : 'Edit submission' }}
      </button>

      <button
        type="button"
        class="primaryButton"
        :disabled="isSubmitting"
        @click="$emit('submit')"
      >
        <span v-if="isSubmitting">Sending to review...</span>
        <span v-else>Submit for admin review</span>
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

.reviewNotice,
.reviewSubmitReminder {
  background: var(--color-warning-surface);
  border: 1px solid var(--color-warning-border);
  border-radius: 1.25rem;
  color: var(--color-warning-text);
  display: grid;
  gap: 0.35rem;
  padding: 1rem;
}

.reviewNotice strong,
.reviewSubmitReminder strong {
  color: var(--color-text);
  font-size: 0.95rem;
  font-weight: 900;
}

.reviewNotice p,
.reviewSubmitReminder p {
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

.sectionHeading {
  display: grid;
  gap: 0.25rem;
}

.sectionHeading h3 {
  color: var(--color-text);
  font-size: 1.25rem;
  margin: 0;
}

.sectionKicker {
  color: var(--color-subtle);
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  margin: 0;
  text-transform: uppercase;
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

dd a {
  color: var(--color-text);
  font-weight: 900;
  text-decoration: underline;
  text-underline-offset: 0.2rem;
}

dd a:hover {
  color: var(--color-accent);
}

.reviewPhotoBlock {
  display: grid;
  gap: 0.5rem;
}

.photoLabel {
  color: var(--color-text);
  font-size: 0.85rem;
  font-weight: 900;
  margin: 0;
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

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
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