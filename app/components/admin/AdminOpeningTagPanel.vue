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

.opening-tag-grid .field + .field {
  margin-top: 0;
}

.opening-tag-field {
  margin-top: 1rem;
}

@media (min-width: 700px) {
  .opening-tag-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  input,
  textarea {
    font-size: 1rem;
  }
}
</style>
