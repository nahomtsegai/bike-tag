<script setup lang="ts">
import { ref } from 'vue'
import { useBikeTags } from '../composables/useBikeTags'

const { addClueToCurrentTag } = useBikeTags()

const clueText = ref('')
const errorMessage = ref('')
const isSaved = ref(false)

const handleSubmit = () => {
  errorMessage.value = ''
  isSaved.value = false

  const didSave = addClueToCurrentTag(clueText.value)

  if (!didSave) {
    errorMessage.value = 'Enter a clue before saving.'
    return
  }

  clueText.value = ''
  isSaved.value = true
}
</script>

<template>
  <form class="addClueForm" @submit.prevent="handleSubmit">
    <div>
      <h3>Add a clue</h3>
      <p>
        Traditionally, the photo comes first. Add a written clue only when riders
        need a little help.
      </p>
    </div>

    <label for="currentTagClue">Clue</label>

    <textarea
      id="currentTagClue"
      v-model="clueText"
      rows="3"
      placeholder="Example: Look near the trail entrance."
      @input="errorMessage = ''; isSaved = false"
    />

    <p v-if="errorMessage" class="errorMessage">
      {{ errorMessage }}
    </p>

    <p v-if="isSaved" class="savedMessage">
      Clue added.
    </p>

    <button type="submit" class="primaryButton">
      Add clue
    </button>
  </form>
</template>

<style scoped>
.addClueForm {
  border-top: 1px solid var(--color-border);
  display: grid;
  gap: 0.75rem;
  margin-top: 1.25rem;
  padding-top: 1.25rem;
}

h3 {
  color: var(--color-text);
  font-size: 1.15rem;
  margin: 0 0 0.35rem;
}

p {
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0;
}

label {
  color: var(--color-text);
  font-size: 0.95rem;
  font-weight: 900;
}

textarea {
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: 1rem;
  color: var(--color-text);
  font-size: 1rem;
  line-height: 1.4;
  padding: 0.95rem 1rem;
  resize: vertical;
  width: 100%;
}

textarea::placeholder {
  color: var(--color-subtle);
}

textarea:focus {
  border-color: var(--color-primary);
  outline: 3px solid var(--color-focus);
}

.errorMessage {
  color: var(--color-error);
  font-size: 0.9rem;
  font-weight: 800;
}

.savedMessage {
  color: var(--color-accent);
  font-size: 0.9rem;
  font-weight: 800;
}

button {
  justify-self: start;
}
</style>