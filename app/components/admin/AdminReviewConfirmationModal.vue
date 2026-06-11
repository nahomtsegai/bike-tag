<template>
  <div
    class="modal-backdrop"
    role="presentation"
    @click.self="$emit('close')"
  >
    <section
      ref="reviewModalElement"
      class="review-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reviewModalTitle"
      tabindex="-1"
    >
      <div class="section-header">
        <div>
          <p class="eyebrow">Confirm review</p>

          <h2 id="reviewModalTitle">
            {{ reviewConfirmationState.title }}
          </h2>
        </div>
      </div>

      <p class="modal-copy">
        {{ reviewConfirmationState.description }}
      </p>

      <dl class="modal-detail-list">
        <div>
          <dt>Submission</dt>
          <dd>{{ submission.nextTitle }}</dd>
        </div>

        <div>
          <dt>Rider</dt>
          <dd>{{ submission.riderName }}</dd>
        </div>

        <div>
          <dt>Reviewer</dt>
          <dd>{{ reviewerNamePendingReview }}</dd>
        </div>
      </dl>

      <div class="button-row modal-actions">
        <button
          class="secondary-button"
          type="button"
          :disabled="isReviewing"
          @click="$emit('close')"
        >
          Cancel
        </button>

        <button
          :class="
            reviewActionToConfirm === 'approve'
              ? 'primary-button'
              : 'danger-button'
          "
          type="button"
          :disabled="isReviewing"
          @click="$emit('confirm')"
        >
          {{ reviewConfirmationState.buttonLabel }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { AdminSubmission } from '~/types/adminSubmissions'

type ReviewActionToConfirm = 'approve' | 'reject' | null

type ReviewConfirmationState = {
  title: string
  description: string
  buttonLabel: string
}

defineProps<{
  submission: AdminSubmission
  reviewActionToConfirm: ReviewActionToConfirm
  reviewConfirmationState: ReviewConfirmationState
  reviewerNamePendingReview: string
  isReviewing: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: []
  'update:reviewModalElement': [value: HTMLElement | null]
}>()

const reviewModalElement = useTemplateRef<HTMLElement>('reviewModalElement')

watch(
  reviewModalElement,
  (element) => {
    emit('update:reviewModalElement', element)
  },
  {
    immediate: true
  }
)
</script>

<style scoped>
.modal-backdrop {
  align-items: center;
  background: rgba(15, 23, 42, 0.52);
  display: flex;
  inset: 0;
  justify-content: center;
  padding: 1rem;
  position: fixed;
  z-index: 50;
}

.review-modal {
  background: #fff;
  border-radius: 1.5rem;
  box-shadow: 0 2rem 5rem rgba(15, 23, 42, 0.28);
  max-width: 34rem;
  padding: 1.25rem;
  width: 100%;
}

.review-modal:focus {
  outline: 3px solid rgba(20, 184, 166, 0.28);
  outline-offset: 3px;
}

.section-header {
  align-items: center;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  margin-bottom: 1rem;
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

.modal-copy {
  color: #475569;
  line-height: 1.6;
  margin: 0 0 1rem;
}

.modal-detail-list {
  display: grid;
  gap: 0.75rem;
  margin: 0;
}

.modal-detail-list div {
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 1rem;
  padding: 0.85rem;
}

.modal-detail-list dt {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.modal-detail-list dd {
  color: #0f172a;
  font-weight: 800;
  margin: 0.25rem 0 0;
  overflow-wrap: anywhere;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1rem;
}

.modal-actions {
  justify-content: flex-end;
}

.primary-button,
.secondary-button,
.danger-button {
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  font: inherit;
  font-weight: 800;
  padding: 0.85rem 1.15rem;
}

.primary-button {
  background: #0f172a;
  color: #fff;
}

.secondary-button {
  background: #e2e8f0;
  color: #0f172a;
}

.danger-button {
  background: #991b1b;
  color: #fff;
}

.primary-button:disabled,
.secondary-button:disabled,
.danger-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

@media (max-width: 860px) {
  .modal-backdrop {
    align-items: flex-end;
    padding: 0.75rem;
  }

  .review-modal {
    border-radius: 1.25rem;
    max-height: calc(100dvh - 1.5rem);
    overflow: auto;
    padding: 1rem;
  }

  .section-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.5rem;
  }

  .modal-actions {
    display: grid;
  }

  .primary-button,
  .secondary-button,
  .danger-button {
    min-height: 3rem;
    width: 100%;
  }
}
</style>