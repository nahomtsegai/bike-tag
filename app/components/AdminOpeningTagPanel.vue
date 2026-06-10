<template>
  <section class="admin-card">
    <div class="section-header">
      <div>
        <p class="eyebrow">Opening tag</p>

        <h2>Create first tag</h2>
      </div>
    </div>

    <p class="helper-text">
      Use this when the game has no active tag. This creates the opening
      mystery spot riders will start from.
    </p>

    <div class="opening-tag-grid">
      <label class="field">
        <span>Title</span>

        <input
          :value="openingTagTitle"
          type="text"
          placeholder="Example: River overlook"
          @input="updateOpeningTagTitle"
        >
      </label>

      <label class="field">
        <span>Photo URL</span>

        <input
          :value="openingTagImageUrl"
          type="url"
          placeholder="https://..."
          @input="updateOpeningTagImageUrl"
        >
      </label>
    </div>

    <label class="field opening-tag-field">
      <span>Clue</span>

      <textarea
        :value="openingTagClue"
        rows="4"
        placeholder="Write the clue riders will see after it unlocks."
        @input="updateOpeningTagClue"
      />
    </label>

    <label class="field opening-tag-field">
      <span>Hidden location map URL</span>

      <input
        :value="openingTagHiddenLocationMapUrl"
        type="url"
        placeholder="Paste a Google Maps share link"
        @input="updateOpeningTagHiddenLocationMapUrl"
      >
    </label>

    <p v-if="openingTagValidationMessage" class="helper-text">
      {{ openingTagValidationMessage }}
    </p>

    <div class="button-row">
      <button
        class="primary-button"
        type="button"
        :disabled="!canCreateOpeningTag"
        @click="$emit('create')"
      >
        {{ createOpeningTagButtonLabel }}
      </button>

      <button
        class="secondary-button"
        type="button"
        :disabled="isCreatingOpeningTag"
        @click="$emit('clear')"
      >
        Clear opening tag form
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  openingTagTitle: string
  openingTagClue: string
  openingTagImageUrl: string
  openingTagHiddenLocationMapUrl: string
  openingTagValidationMessage: string
  canCreateOpeningTag: boolean
  createOpeningTagButtonLabel: string
  isCreatingOpeningTag: boolean
}>()

const emit = defineEmits<{
  create: []
  clear: []
  'update:openingTagTitle': [value: string]
  'update:openingTagClue': [value: string]
  'update:openingTagImageUrl': [value: string]
  'update:openingTagHiddenLocationMapUrl': [value: string]
}>()

const getInputValue = (event: Event) => {
  return event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLTextAreaElement
    ? event.target.value
    : ''
}

const updateOpeningTagTitle = (event: Event) => {
  emit('update:openingTagTitle', getInputValue(event))
}

const updateOpeningTagClue = (event: Event) => {
  emit('update:openingTagClue', getInputValue(event))
}

const updateOpeningTagImageUrl = (event: Event) => {
  emit('update:openingTagImageUrl', getInputValue(event))
}

const updateOpeningTagHiddenLocationMapUrl = (event: Event) => {
  emit('update:openingTagHiddenLocationMapUrl', getInputValue(event))
}
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

.helper-text {
  color: #64748b;
  margin: 1rem 0 0;
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

input,
textarea {
  background: #fff;
  border: 1px solid rgba(100, 116, 139, 0.38);
  border-radius: 999px;
  color: #0f172a;
  font: inherit;
  padding: 0.85rem 1rem;
  width: 100%;
}

textarea {
  border-radius: 1rem;
  min-height: 7rem;
  resize: vertical;
}

input:focus,
textarea:focus {
  border-color: #0f766e;
  outline: 3px solid rgba(20, 184, 166, 0.18);
}

.opening-tag-grid {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
}

.opening-tag-field {
  margin-top: 1rem;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1rem;
}

.primary-button,
.secondary-button {
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

.primary-button:disabled,
.secondary-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

@media (min-width: 700px) {
  .opening-tag-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
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

  .button-row {
    display: grid;
    grid-template-columns: 1fr;
  }

  .primary-button,
  .secondary-button {
    min-height: 3rem;
    width: 100%;
  }
}

@media (max-width: 520px) {
  input,
  textarea {
    font-size: 1rem;
  }
}
</style>
