<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

const form = reactive({
  riderName: '',
  matchPhoto: null as File | null,
  notes: '',
  nextTitle: '',
  nextClue: '',
  locationName: '',
  nextPhoto: null as File | null
})

const hasUnsavedChanges = computed(() => {
  return Boolean(
    form.riderName.trim() ||
      form.matchPhoto ||
      form.notes.trim() ||
      form.nextTitle.trim() ||
      form.nextClue.trim() ||
      form.locationName.trim() ||
      form.nextPhoto
  )
})

const handleMatchPhotoChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  form.matchPhoto = input.files?.[0] ?? null
}

const handleNextPhotoChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  form.nextPhoto = input.files?.[0] ?? null
}

const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  if (!hasUnsavedChanges.value) {
    return
  }

  event.preventDefault()
  event.returnValue = ''
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

onBeforeRouteLeave(() => {
  if (!hasUnsavedChanges.value) {
    return true
  }

  return window.confirm(
    'You have unsaved changes. Are you sure you want to leave this page?'
  )
})
</script>

<template>
  <main class="page">
    <div class="pageContent">
      <AppHeader />

      <section class="pageHero">
        <p class="eyebrow">Submit tag</p>
        <h1 class="pageTitle">Found it? Prove it. Then hide the next one.</h1>
        <p class="pageIntro">
          Submit your matching photo for the current tag and share the next
          mystery spot for riders to find.
        </p>
      </section>

      <form class="submitForm">
        <section class="formSection">
          <h2>Your find</h2>

          <label for="riderName">Your name</label>
          <input
            id="riderName"
            v-model="form.riderName"
            type="text"
            placeholder="Example: Nahom"
          />

          <label for="matchPhoto">Matching tag photo</label>
          <input
            id="matchPhoto"
            type="file"
            accept="image/*"
            @change="handleMatchPhotoChange"
          />

          <label for="notes">Optional notes</label>
          <textarea
            id="notes"
            v-model="form.notes"
            rows="4"
            placeholder="Anything helpful about your find?"
          />
        </section>

        <section class="formSection">
          <h2>Next tag</h2>

          <label for="nextTitle">New tag title</label>
          <input
            id="nextTitle"
            v-model="form.nextTitle"
            type="text"
            placeholder="Example: Bridge view"
          />

          <label for="nextClue">New tag clue</label>
          <textarea
            id="nextClue"
            v-model="form.nextClue"
            rows="4"
            placeholder="Write a clue that helps without giving it away."
          />

          <label for="locationName">Location name</label>
          <input
            id="locationName"
            v-model="form.locationName"
            type="text"
            placeholder="Example: Waterfront Park"
          />

          <label for="nextPhoto">New tag photo</label>
          <input
            id="nextPhoto"
            type="file"
            accept="image/*"
            @change="handleNextPhotoChange"
          />
        </section>

        <button class="primaryButton submitButton" type="button">
          Submit tag
        </button>
      </form>
    </div>
  </main>
</template>

<style scoped>
.submitForm {
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
}

.formSection {
  border: 1px solid #e5e7eb;
  border-radius: 1.5rem;
  display: grid;
  gap: 0.75rem;
  padding: 1.25rem;
}

h2 {
  color: #111827;
  font-size: 1.35rem;
  margin: 0 0 0.5rem;
}

label {
  color: #111827;
  font-size: 0.95rem;
  font-weight: 900;
}

input,
textarea {
  border: 1px solid #d1d5db;
  border-radius: 1rem;
  color: #111827;
  font-size: 1rem;
  padding: 1rem;
  width: 100%;
}

textarea {
  resize: vertical;
}

input:focus,
textarea:focus {
  border-color: #111827;
  outline: 3px solid #dbeafe;
}

.submitButton {
  width: 100%;
}

@media (min-width: 900px) {
  .submitForm {
    grid-template-columns: repeat(2, 1fr);
  }

  .submitButton {
    grid-column: 1 / -1;
    justify-self: start;
    width: auto;
  }
}
</style>