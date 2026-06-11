<template>
  <template v-if="
    submission.status === 'pending' ||
    submission.status === 'rejected'
  ">
    <div class="review-actions">
      <div class="section-header compact-header">
        <div>
          <p class="eyebrow">Review</p>
          <h3>Take action</h3>
        </div>
      </div>

      <template v-if="submission.status === 'pending'">
        <p class="review-warning">
          Approving this submission will mark the current tag as found and make
          the submitted next tag active.
        </p>

        <label class="field">
          <span>Rejection reason</span>

          <textarea :value="rejectionReason" placeholder="Optional reason for rejecting this submission" rows="4"
            @input="updateRejectionReason" />
        </label>

        <div class="button-row">
          <button ref="approveSubmissionButtonElement" class="primary-button" type="button" :disabled="isActionDisabled"
            @click="$emit('approve')">
            Approve submission
          </button>

          <button ref="rejectSubmissionButtonElement" class="danger-button" type="button" :disabled="isActionDisabled"
            @click="$emit('reject')">
            Reject submission
          </button>

          <button class="danger-button" type="button" :disabled="isActionDisabled" @click="$emit('delete')">
            {{ isDeletingSubmission ? 'Deleting...' : 'Delete pending submission' }}
          </button>
        </div>
      </template>

      <div v-else class="button-row">
        <button class="danger-button" type="button" :disabled="isDeletingSubmission || isArchivingSubmission"
          @click="$emit('delete')">
          {{ isDeletingSubmission ? 'Deleting...' : 'Delete rejected submission' }}
        </button>
      </div>
    </div>
  </template>

  <div v-if="
    submission.status === 'approved' &&
    !submission.archivedAt
  " class="review-actions">
    <div class="section-header compact-header">
      <div>
        <p class="eyebrow">Archive</p>
        <h3>Clean up approved submission</h3>
      </div>
    </div>

    <p class="helper-text">
      Archiving hides this approved submission from the default admin list
      without deleting game history.
    </p>

    <div class="button-row">
      <button class="secondary-button" type="button" :disabled="isActionDisabled" @click="$emit('archive')">
        {{ isArchivingSubmission ? 'Archiving...' : 'Archive approved submission' }}
      </button>
    </div>
  </div>

  <div v-if="
    submission.status === 'approved' &&
    submission.archivedAt
  " class="review-actions">
    <div class="section-header compact-header">
      <div>
        <p class="eyebrow">Archived</p>
        <h3>This approved submission is archived</h3>
      </div>
    </div>

    <p class="helper-text">
      Archived approved submissions stay available for admin review when the
      archive filter is enabled.
    </p>
  </div>
</template>

<script setup lang="ts">
import type { AdminSubmission } from '~/types/adminSubmissions'

const props = defineProps<{
  submission: AdminSubmission
  rejectionReason: string
  isReviewing: boolean
  isDeletingSubmission: boolean
  isArchivingSubmission: boolean
}>()

const emit = defineEmits<{
  approve: []
  reject: []
  delete: []
  archive: []
  'update:rejectionReason': [value: string]
  'update:approveSubmissionButtonElement': [value: HTMLButtonElement | null]
  'update:rejectSubmissionButtonElement': [value: HTMLButtonElement | null]
}>()

const approveSubmissionButtonElement = useTemplateRef<HTMLButtonElement>(
  'approveSubmissionButtonElement'
)

const rejectSubmissionButtonElement = useTemplateRef<HTMLButtonElement>(
  'rejectSubmissionButtonElement'
)

const isActionDisabled = computed(() => {
  return (
    props.isReviewing ||
    props.isDeletingSubmission ||
    props.isArchivingSubmission
  )
})

const getTextareaValue = (event: Event) => {
  return event.target instanceof HTMLTextAreaElement ? event.target.value : ''
}

const updateRejectionReason = (event: Event) => {
  emit('update:rejectionReason', getTextareaValue(event))
}

watch(
  approveSubmissionButtonElement,
  (element) => {
    emit('update:approveSubmissionButtonElement', element)
  },
  {
    immediate: true
  }
)

watch(
  rejectSubmissionButtonElement,
  (element) => {
    emit('update:rejectSubmissionButtonElement', element)
  },
  {
    immediate: true
  }
)
</script>

<style scoped>
.review-actions {
  border-top: 1px solid rgba(148, 163, 184, 0.25);
  display: grid;
  gap: 1rem;
  padding-top: 1rem;
}

.compact-header {
  margin-bottom: 0;
}

.compact-header h3 {
  color: #0f172a;
  font-size: 1.15rem;
  margin: 0.25rem 0 0;
}

.review-warning {
  background: #fffbeb;
  border: 1px solid rgba(245, 158, 11, 0.32);
  border-radius: 1rem;
  color: #92400e;
  font-weight: 800;
  line-height: 1.55;
  margin: 0;
  padding: 0.95rem 1rem;
}

textarea {
  background: #fff;
  border: 1px solid rgba(100, 116, 139, 0.38);
  border-radius: 1rem;
  color: #0f172a;
  font: inherit;
  min-height: 7rem;
  padding: 0.85rem 1rem;
  resize: vertical;
  width: 100%;
}

textarea:focus {
  border-color: #0f766e;
  outline: 3px solid rgba(20, 184, 166, 0.18);
}

@media (max-width: 860px) {
  textarea {
    font-size: 1rem;
  }
}
</style>
