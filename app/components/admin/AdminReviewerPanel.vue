<template>
  <section ref="reviewerSectionElement" class="admin-card">
    <div class="section-header">
      <div>
        <p class="eyebrow">Reviewer</p>

        <h2>Reviewer name</h2>
      </div>
    </div>

    <label class="field">
      <span>Reviewer name</span>

      <input ref="reviewerNameInputElement" :value="reviewerName" type="text" autocomplete="name"
        placeholder="Reviewer name" @input="updateReviewerName">
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

@media (max-width: 520px) {
  input {
    font-size: 1rem;
  }
}
</style>
