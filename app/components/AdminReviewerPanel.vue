<template>
  <section
    ref="reviewerSectionElement"
    class="admin-card"
  >
    <div class="section-header">
      <div>
        <p class="eyebrow">Reviewer</p>

        <h2>Reviewer name</h2>
      </div>
    </div>

    <label class="field">
      <span>Reviewer name</span>

      <input
        ref="reviewerNameInputElement"
        :value="reviewerName"
        type="text"
        autocomplete="name"
        placeholder="Reviewer name"
        @input="updateReviewerName"
      >
    </label>

    <p class="helper-text">
      This name is only kept while this page is open, then saved with approval
      and rejection actions.
    </p>
  </section>
</template>

<script setup lang="ts">
const reviewerSectionElement = useTemplateRef<HTMLElement>(
  'reviewerSectionElement'
)

const reviewerNameInputElement = useTemplateRef<HTMLInputElement>(
  'reviewerNameInputElement'
)

defineProps<{
  reviewerName: string
}>()

const emit = defineEmits<{
  'update:reviewerName': [value: string]
  'update:reviewerSectionElement': [value: HTMLElement | null]
  'update:reviewerNameInputElement': [value: HTMLInputElement | null]
}>()

const getInputValue = (event: Event) => {
  return event.target instanceof HTMLInputElement ? event.target.value : ''
}

const updateReviewerName = (event: Event) => {
  emit('update:reviewerName', getInputValue(event))
}

watch(
  reviewerSectionElement,
  (element) => {
    emit('update:reviewerSectionElement', element)
  },
  {
    immediate: true
  }
)

watch(
  reviewerNameInputElement,
  (element) => {
    emit('update:reviewerNameInputElement', element)
  },
  {
    immediate: true
  }
)
</script>

<style scoped>
.admin-card {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 1.5rem;
  box-shadow: 0 1rem 3rem rgba(15, 23, 42, 0.08);
  padding: 1.25rem;
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

.field {
  display: grid;
  gap: 0.45rem;
}

.field span {
  color: #334155;
  font-size: 0.9rem;
  font-weight: 700;
}

input {
  background: #fff;
  border: 1px solid rgba(100, 116, 139, 0.38);
  border-radius: 999px;
  color: #0f172a;
  font: inherit;
  padding: 0.85rem 1rem;
  width: 100%;
}

input:focus {
  border-color: #0f766e;
  outline: 3px solid rgba(20, 184, 166, 0.18);
}

.helper-text {
  color: #64748b;
  margin: 1rem 0 0;
}

@media (max-width: 860px) {
  .admin-card {
    border-radius: 1.25rem;
    padding: 1rem;
  }

  .section-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.5rem;
  }
}

@media (max-width: 520px) {
  input {
    font-size: 1rem;
  }
}
</style>