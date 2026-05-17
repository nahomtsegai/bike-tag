<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

type FormErrors = {
  riderName?: string
  findLocationName?: string
  matchPhoto?: string
  nextTitle?: string
  nextPhoto?: string
}

const formElement = ref<HTMLFormElement | null>(null)
const isSubmitSuccessful = ref(false)

const form = reactive({
  riderName: '',
  findLocationName: '',
  matchPhoto: null as File | null,
  notes: '',
  nextTitle: '',
  nextPhoto: null as File | null
})

const errors = reactive<FormErrors>({})

const hasUnsavedChanges = computed(() => {
  return Boolean(
    form.riderName.trim() ||
      form.findLocationName.trim() ||
      form.matchPhoto ||
      form.notes.trim() ||
      form.nextTitle.trim() ||
      form.nextPhoto
  )
})

const isFormReady = computed(() => {
  return Boolean(
    form.riderName.trim() &&
      form.findLocationName.trim() &&
      form.matchPhoto &&
      form.nextTitle.trim() &&
      form.nextPhoto
  )
})

const clearErrors = () => {
  errors.riderName = undefined
  errors.findLocationName = undefined
  errors.matchPhoto = undefined
  errors.nextTitle = undefined
  errors.nextPhoto = undefined
}

const validateForm = () => {
  clearErrors()

  if (!form.riderName.trim()) {
    errors.riderName = 'Enter your name.'
  }

  if (!form.findLocationName.trim()) {
    errors.findLocationName = 'Enter where you found the current tag.'
  }

  if (!form.matchPhoto) {
    errors.matchPhoto = 'Add a matching photo for the current tag.'
  }

  if (!form.nextTitle.trim()) {
    errors.nextTitle = 'Enter a title for the next tag.'
  }

  if (!form.nextPhoto) {
    errors.nextPhoto = 'Add a photo for the next tag.'
  }

  return !Object.values(errors).some(Boolean)
}

const resetForm = () => {
  form.riderName = ''
  form.findLocationName = ''
  form.matchPhoto = null
  form.notes = ''
  form.nextTitle = ''
  form.nextPhoto = null

  formElement.value?.reset()
}

const handleMatchPhotoChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  form.matchPhoto = input.files?.[0] ?? null
  errors.matchPhoto = undefined
  isSubmitSuccessful.value = false
}

const handleNextPhotoChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  form.nextPhoto = input.files?.[0] ?? null
  errors.nextPhoto = undefined
  isSubmitSuccessful.value = false
}

const handleSubmit = async () => {
  isSubmitSuccessful.value = false

  if (!validateForm()) {
    return
  }

  resetForm()
  clearErrors()

  await nextTick()

  isSubmitSuccessful.value = true
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

      <div v-if="isSubmitSuccessful" class="successMessage" role="status">
        <h2>Tag submitted</h2>
        <p>
          Nice. This is a fake success for now, so nothing is saved yet.
          Backend submission will come in a later phase.
        </p>
      </div>

      <form ref="formElement" class="submitForm" @submit.prevent="handleSubmit">
        <section class="formSection">
          <h2>Your find</h2>

          <div class="fieldGroup">
            <label for="riderName">Your name</label>
            <input
              id="riderName"
              v-model="form.riderName"
              type="text"
              placeholder="Example: Nahom"
              :aria-invalid="Boolean(errors.riderName)"
              aria-describedby="riderNameError"
              @input="errors.riderName = undefined; isSubmitSuccessful = false"
            />
            <p v-if="errors.riderName" id="riderNameError" class="errorMessage">
              {{ errors.riderName }}
            </p>
          </div>

          <div class="fieldGroup">
            <label for="findLocationName">Found location</label>
            <input
              id="findLocationName"
              v-model="form.findLocationName"
              type="text"
              placeholder="Example: Iroquois Park"
              :aria-invalid="Boolean(errors.findLocationName)"
              aria-describedby="findLocationNameError"
              @input="errors.findLocationName = undefined; isSubmitSuccessful = false"
            />
            <p
              v-if="errors.findLocationName"
              id="findLocationNameError"
              class="errorMessage"
            >
              {{ errors.findLocationName }}
            </p>
          </div>

          <div class="fieldGroup">
            <label for="matchPhoto">Matching tag photo</label>
            <input
              id="matchPhoto"
              type="file"
              accept="image/*"
              :aria-invalid="Boolean(errors.matchPhoto)"
              aria-describedby="matchPhotoError"
              @change="handleMatchPhotoChange"
            />
            <p v-if="errors.matchPhoto" id="matchPhotoError" class="errorMessage">
              {{ errors.matchPhoto }}
            </p>
          </div>

          <div class="fieldGroup">
            <label for="notes">Optional notes</label>
            <textarea
              id="notes"
              v-model="form.notes"
              rows="4"
              placeholder="Anything helpful about your find?"
              @input="isSubmitSuccessful = false"
            />
          </div>
        </section>

        <section class="formSection">
          <h2>Next tag</h2>

          <div class="fieldGroup">
            <label for="nextTitle">New tag title</label>
            <input
              id="nextTitle"
              v-model="form.nextTitle"
              type="text"
              placeholder="Example: Bridge view"
              :aria-invalid="Boolean(errors.nextTitle)"
              aria-describedby="nextTitleError"
              @input="errors.nextTitle = undefined; isSubmitSuccessful = false"
            />
            <p v-if="errors.nextTitle" id="nextTitleError" class="errorMessage">
              {{ errors.nextTitle }}
            </p>
          </div>

          <div class="fieldGroup">
            <label for="nextPhoto">New tag photo</label>
            <input
              id="nextPhoto"
              type="file"
              accept="image/*"
              :aria-invalid="Boolean(errors.nextPhoto)"
              aria-describedby="nextPhotoError"
              @change="handleNextPhotoChange"
            />
            <p v-if="errors.nextPhoto" id="nextPhotoError" class="errorMessage">
              {{ errors.nextPhoto }}
            </p>
          </div>
        </section>

        <p v-if="!isFormReady" class="submitHint">
          Fill out all required fields to submit.
        </p>

        <button
          class="primaryButton submitButton"
          type="submit"
          :disabled="!isFormReady"
        >
          Submit tag
        </button>
      </form>
    </div>
  </main>
</template>

<style scoped>
.successMessage {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 1.5rem;
  margin-top: 1.5rem;
  padding: 1.25rem;
}

.successMessage h2 {
  color: #111827;
  font-size: 1.35rem;
  margin: 0 0 0.5rem;
}

.successMessage p {
  color: #4b5563;
  line-height: 1.6;
  margin: 0;
}

.submitForm {
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
}

.formSection {
  align-content: start;
  border: 1px solid #e5e7eb;
  border-radius: 1.5rem;
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
}

.formSection h2 {
  color: #111827;
  font-size: 1.35rem;
  line-height: 1.1;
  margin: 0;
}

.fieldGroup {
  display: grid;
  gap: 0.45rem;
}

label {
  color: #111827;
  font-size: 0.95rem;
  font-weight: 900;
}

input,
textarea {
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 1rem;
  color: #111827;
  font-size: 1rem;
  line-height: 1.4;
  padding: 0.95rem 1rem;
  width: 100%;
}

input {
  min-height: 3.25rem;
}

input[type='file'] {
  cursor: pointer;
  padding: 0.85rem;
}

input[type='file']::file-selector-button {
  background: #111827;
  border: 0;
  border-radius: 999px;
  color: #ffffff;
  cursor: pointer;
  font: inherit;
  font-weight: 800;
  margin-right: 0.75rem;
  padding: 0.65rem 0.9rem;
}

textarea {
  min-height: 7rem;
  resize: vertical;
}

input::placeholder,
textarea::placeholder {
  color: #6b7280;
}

input:focus,
textarea:focus {
  border-color: #111827;
  outline: 3px solid #dbeafe;
}

input[aria-invalid='true'],
textarea[aria-invalid='true'] {
  border-color: #dc2626;
}

.errorMessage {
  color: #dc2626;
  font-size: 0.9rem;
  font-weight: 700;
  margin: 0;
}

.submitHint {
  color: #6b7280;
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0.25rem 0 0;
}

.submitButton {
  margin-top: 0.25rem;
  min-height: 3.25rem;
  width: 100%;
}

.submitButton:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

@media (min-width: 900px) {
  .submitForm {
    align-items: start;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .formSection {
    padding: 1.5rem;
  }

  .submitHint {
    grid-column: 1 / -1;
  }

  .submitButton {
    grid-column: 1 / -1;
    justify-self: start;
    width: auto;
  }
}
</style>