<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSubmitTagForm } from '../composables/useSubmitTagForm'

type SubmitStep = 'find' | 'next' | 'review'

const {
  form,
  errors,
  formElement,
  isReviewing,
  isSubmitting,
  isCapturingFoundLocation,
  isCapturingNextHiddenLocation,
  submitError,
  submitWarning,
  matchPhotoPreviewUrl,
  nextPhotoPreviewUrl,
  hasCapturedFoundLocation,
  hasCapturedNextHiddenLocation,
  foundLocationDisplay,
  nextHiddenLocationDisplay,
  isFormReady,
  firstErrorField,
  validationSummary,
  matchPhotoName,
  nextPhotoName,
  clearFieldError,
  clearSubmitFeedback,
  clearCapturedFoundLocation,
  clearCapturedNextHiddenLocation,
  captureFoundLocation,
  captureNextHiddenLocation,
  handleMatchPhotoChange,
  handleNextPhotoChange,
  handleReview,
  handleEdit,
  handleSubmit
} = useSubmitTagForm()

const activeStep = ref<SubmitStep>('find')

const isFindStepComplete = computed(() => {
  return Boolean(
    form.riderName.trim() &&
    hasCapturedFoundLocation.value &&
    form.matchPhoto
  )
})

const isNextStepComplete = computed(() => {
  return Boolean(
    form.nextTitle.trim() &&
    form.nextClue.trim() &&
    hasCapturedNextHiddenLocation.value &&
    form.nextPhoto
  )
})

const stepItems = computed(() => {
  return [
    {
      id: 'find',
      label: 'Prove your find',
      isActive: activeStep.value === 'find',
      isComplete: isFindStepComplete.value
    },
    {
      id: 'next',
      label: 'Create next tag',
      isActive: activeStep.value === 'next',
      isComplete: isNextStepComplete.value
    },
    {
      id: 'review',
      label: 'Review and submit',
      isActive: activeStep.value === 'review',
      isComplete: isFormReady.value
    }
  ] as const
})

const activeStepNumber = computed(() => {
  if (activeStep.value === 'find') {
    return 1
  }

  if (activeStep.value === 'next') {
    return 2
  }

  return 3
})

const activeStepTitle = computed(() => {
  if (activeStep.value === 'find') {
    return 'Prove your find'
  }

  if (activeStep.value === 'next') {
    return 'Create the next tag'
  }

  return 'Review and submit'
})

const activeStepIntro = computed(() => {
  if (activeStep.value === 'find') {
    return 'Start by proving you found the current tag. Capture your current location while you are near the tag and upload your match photo.'
  }

  if (activeStep.value === 'next') {
    return 'Now ride to your next mystery spot, take the next tag photo, write the clue, and capture the hidden location for admins.'
  }

  return 'Check the full submission before sending it to admin review. The current tag will stay active until approval.'
})

const showFindStep = computed(() => {
  return activeStep.value === 'find'
})

const showNextStep = computed(() => {
  return activeStep.value === 'next'
})

const moveToFindStep = () => {
  activeStep.value = 'find'
}

const moveToNextStep = () => {
  activeStep.value = 'next'
}

const moveToReviewStep = async () => {
  await handleReview()

  if (isFormReady.value) {
    activeStep.value = 'review'
  }
}

const moveToStep = (step: SubmitStep) => {
  if (step === 'review') {
    void moveToReviewStep()
    return
  }

  activeStep.value = step
}

const editFromReview = () => {
  handleEdit()
  activeStep.value = 'find'
}
</script>

<template>
  <main class="page">
    <div class="pageContent">
      <AppHeader />

      <section class="pageHero">
        <p class="eyebrow">Submit tag</p>
        <h1 class="pageTitle">Claim the tag, then create the next ride.</h1>
        <p class="pageIntro">
          First prove you found the current tag. Then, after you choose the next
          mystery spot, send the full submission to admin review.
        </p>
      </section>

      <section class="submitGuide" aria-labelledby="submitGuideTitle">
        <div>
          <p class="eyebrow">How it works</p>
          <h2 id="submitGuideTitle">
            Submit in three simple steps.
          </h2>
        </div>

        <ol class="guideList">
          <li>Prove your find with a match photo and captured location.</li>
          <li>Ride to your next spot and capture the next hidden location.</li>
          <li>Review everything, then send it to admins for approval.</li>
        </ol>
      </section>

      <section class="submitStepper" aria-label="Submit progress">
        <button
          v-for="step in stepItems"
          :key="step.id"
          type="button"
          class="stepperItem"
          :class="{
            stepperItemActive: step.isActive,
            stepperItemComplete: step.isComplete
          }"
          @click="moveToStep(step.id)"
        >
          <span class="stepperStatus">
            {{ step.isComplete ? 'Done' : step.isActive ? 'Now' : 'Next' }}
          </span>
          <strong>{{ step.label }}</strong>
        </button>
      </section>

      <section class="activeStepCard" aria-live="polite">
        <p class="sectionStep">Step {{ activeStepNumber }}</p>
        <h2>{{ activeStepTitle }}</h2>
        <p>{{ activeStepIntro }}</p>
      </section>

      <div v-if="submitWarning" class="warningBanner" role="status">
        {{ submitWarning }}
      </div>

      <div v-if="submitError" class="errorBanner" role="alert">
        {{ submitError }}
      </div>

      <div
        v-if="validationSummary"
        class="validationSummary"
        role="alert"
      >
        {{ validationSummary }}
      </div>

      <SubmitTagReview
        v-if="isReviewing"
        :form="form"
        :match-photo-preview-url="matchPhotoPreviewUrl"
        :next-photo-preview-url="nextPhotoPreviewUrl"
        :is-submitting="isSubmitting"
        @edit="editFromReview"
        @submit="handleSubmit"
      />

      <form
        v-else
        ref="formElement"
        class="submitForm"
        @submit.prevent="moveToReviewStep"
      >
        <section
          v-show="showFindStep"
          class="formSection"
        >
          <div class="sectionIntro">
            <p class="sectionStep">Step 1</p>
            <h2>Your find</h2>
            <p>
              Tell us who found the current tag, capture your current location,
              and upload a clear photo showing your bike at the matching spot.
            </p>
          </div>

          <div
            class="fieldGroup"
            :class="{ fieldGroupFirstError: firstErrorField === 'riderName' }"
            data-submit-field="riderName"
          >
            <label for="riderName">Rider name</label>
            <input
              id="riderName"
              v-model="form.riderName"
              placeholder="Example: Nahom"
              :aria-invalid="Boolean(errors.riderName)"
              aria-describedby="riderNameHelp riderNameError"
              @input="clearFieldError('riderName')"
            >
            <p id="riderNameHelp" class="fieldHelp">
              Use your name or rider handle so admins know who submitted the tag.
            </p>
            <p v-if="errors.riderName" id="riderNameError" class="errorMessage">
              {{ errors.riderName }}
            </p>
          </div>

          <div
            class="fieldGroup"
            :class="{ fieldGroupFirstError: firstErrorField === 'foundLocation' }"
            data-submit-field="foundLocation"
          >
            <label>Found location</label>

            <div
              class="locationCaptureCard"
              :class="{
                locationCaptureCardCaptured: hasCapturedFoundLocation,
                locationCaptureCardError: Boolean(errors.foundLocation)
              }"
            >
              <div>
                <p class="locationCaptureTitle">
                  {{ hasCapturedFoundLocation
                    ? 'Location captured'
                    : 'Use your current location' }}
                </p>

                <p class="fieldHelp">
                  Capture your device location while you are near the found tag.
                  This helps admins review the match.
                </p>
              </div>

              <div
                v-if="hasCapturedFoundLocation"
                class="capturedLocationDetails"
                aria-live="polite"
              >
                <p>
                  <span>Latitude</span>
                  <strong>{{ foundLocationDisplay.latitude }}</strong>
                </p>

                <p>
                  <span>Longitude</span>
                  <strong>{{ foundLocationDisplay.longitude }}</strong>
                </p>

                <p>
                  <span>Accuracy</span>
                  <strong>{{ foundLocationDisplay.accuracy }}</strong>
                </p>

                <p>
                  <span>Captured</span>
                  <strong>{{ foundLocationDisplay.capturedAt }}</strong>
                </p>

                <a
                  :href="form.foundLocationMapUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open captured location
                </a>
              </div>

              <div class="locationCaptureActions">
                <button
                  class="secondaryButton"
                  type="button"
                  :disabled="isCapturingFoundLocation"
                  @click="captureFoundLocation"
                >
                  {{ isCapturingFoundLocation
                    ? 'Capturing location...'
                    : hasCapturedFoundLocation
                      ? 'Recapture location'
                      : 'Use my current location' }}
                </button>

                <button
                  v-if="hasCapturedFoundLocation"
                  class="textButton"
                  type="button"
                  :disabled="isCapturingFoundLocation"
                  @click="clearCapturedFoundLocation"
                >
                  Clear captured location
                </button>
              </div>
            </div>

            <p
              v-if="errors.foundLocation"
              id="foundLocationError"
              class="errorMessage"
            >
              {{ errors.foundLocation }}
            </p>
          </div>

          <div
            class="fieldGroup"
            :class="{ fieldGroupFirstError: firstErrorField === 'matchPhoto' }"
            data-submit-field="matchPhoto"
          >
            <label for="matchPhoto">Match photo</label>

            <div
              class="filePicker"
              :class="{ filePickerError: Boolean(errors.matchPhoto) }"
            >
              <input
                id="matchPhoto"
                class="fileInput"
                type="file"
                accept="image/*"
                :aria-invalid="Boolean(errors.matchPhoto)"
                aria-describedby="matchPhotoHelp matchPhotoError"
                @change="handleMatchPhotoChange"
              >

              <label class="fileButton" for="matchPhoto">
                Choose file
              </label>

              <span class="fileName">
                {{ matchPhotoName }}
              </span>
            </div>

            <p id="matchPhotoHelp" class="fieldHelp">
              Upload a clear photo that proves you found the current tag. Try to
              include your bike, the same landmark, and enough background detail
              for an admin to compare the match. Use an image file under 8 MB.
            </p>

            <p v-if="errors.matchPhoto" id="matchPhotoError" class="errorMessage">
              {{ errors.matchPhoto }}
            </p>

            <div v-if="matchPhotoPreviewUrl" class="photoPreview">
              <img
                :src="matchPhotoPreviewUrl"
                alt="Preview of matching tag photo"
              >
            </div>
          </div>

          <div class="fieldGroup">
            <label for="notes">Optional notes</label>
            <textarea
              id="notes"
              v-model="form.notes"
              rows="4"
              placeholder="Example: The original tag was near the south side of the bridge."
              aria-describedby="notesHelp"
              @input="clearSubmitFeedback"
            />
            <p id="notesHelp" class="fieldHelp">
              Add anything that could help an admin review your find. Keep it
              practical and location focused.
            </p>
          </div>

          <div class="stepActions">
            <button
              class="primaryButton"
              type="button"
              :disabled="!isFindStepComplete"
              @click="moveToNextStep"
            >
              Continue to next tag
            </button>
          </div>
        </section>

        <section
          v-show="showNextStep"
          class="formSection"
        >
          <div class="sectionIntro">
            <p class="sectionStep">Step 2</p>
            <h2>Next tag</h2>
            <p>
              Pick the next mystery spot after you ride there. The next photo
              may become public after approval, but the exact map location stays
              hidden from players.
            </p>
          </div>

          <div
            class="fieldGroup"
            :class="{ fieldGroupFirstError: firstErrorField === 'nextTitle' }"
            data-submit-field="nextTitle"
          >
            <label for="nextTitle">Next tag title</label>
            <input
              id="nextTitle"
              v-model="form.nextTitle"
              type="text"
              placeholder="Example: Bridge view"
              :aria-invalid="Boolean(errors.nextTitle)"
              aria-describedby="nextTitleHelp nextTitleError"
              @input="clearFieldError('nextTitle')"
            >
            <p id="nextTitleHelp" class="fieldHelp">
              Give the next tag a short, friendly title. Avoid naming the exact
              location unless you want the tag to be very easy.
            </p>
            <p v-if="errors.nextTitle" id="nextTitleError" class="errorMessage">
              {{ errors.nextTitle }}
            </p>
          </div>

          <div
            class="fieldGroup"
            :class="{ fieldGroupFirstError: firstErrorField === 'nextClue' }"
            data-submit-field="nextClue"
          >
            <label for="nextClue">Hidden clue</label>
            <textarea
              id="nextClue"
              v-model="form.nextClue"
              rows="4"
              placeholder="Example: Look for the view where the trail bends toward the water."
              :aria-invalid="Boolean(errors.nextClue)"
              aria-describedby="nextClueHelp nextClueError"
              @input="clearFieldError('nextClue')"
            />
            <p id="nextClueHelp" class="fieldHelp">
              This clue unlocks after 5 days. Make it helpful, but not so obvious
              that riders can skip the hunt.
            </p>
            <p v-if="errors.nextClue" id="nextClueError" class="errorMessage">
              {{ errors.nextClue }}
            </p>
          </div>

          <div
            class="fieldGroup"
            :class="{ fieldGroupFirstError: firstErrorField === 'nextHiddenLocation' }"
            data-submit-field="nextHiddenLocation"
          >
            <label>Hidden next location</label>

            <div
              class="locationCaptureCard"
              :class="{
                locationCaptureCardCaptured: hasCapturedNextHiddenLocation,
                locationCaptureCardError: Boolean(errors.nextHiddenLocation)
              }"
            >
              <div>
                <p class="locationCaptureTitle">
                  {{ hasCapturedNextHiddenLocation
                    ? 'Next location captured'
                    : 'Use your current location for the next tag' }}
                </p>

                <p class="fieldHelp">
                  Capture your device location while you are standing at the next
                  mystery spot. Admins will use this exact location, but players
                  will not see it while the tag is active.
                </p>
              </div>

              <div
                v-if="hasCapturedNextHiddenLocation"
                class="capturedLocationDetails"
                aria-live="polite"
              >
                <p>
                  <span>Latitude</span>
                  <strong>{{ nextHiddenLocationDisplay.latitude }}</strong>
                </p>

                <p>
                  <span>Longitude</span>
                  <strong>{{ nextHiddenLocationDisplay.longitude }}</strong>
                </p>

                <p>
                  <span>Accuracy</span>
                  <strong>{{ nextHiddenLocationDisplay.accuracy }}</strong>
                </p>

                <p>
                  <span>Captured</span>
                  <strong>{{ nextHiddenLocationDisplay.capturedAt }}</strong>
                </p>

                <a
                  :href="form.nextHiddenLocationMapUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open captured next location
                </a>
              </div>

              <div class="locationCaptureActions">
                <button
                  class="secondaryButton"
                  type="button"
                  :disabled="isCapturingNextHiddenLocation"
                  @click="captureNextHiddenLocation"
                >
                  {{ isCapturingNextHiddenLocation
                    ? 'Capturing location...'
                    : hasCapturedNextHiddenLocation
                      ? 'Recapture next location'
                      : 'Use my current location' }}
                </button>

                <button
                  v-if="hasCapturedNextHiddenLocation"
                  class="textButton"
                  type="button"
                  :disabled="isCapturingNextHiddenLocation"
                  @click="clearCapturedNextHiddenLocation"
                >
                  Clear captured next location
                </button>
              </div>
            </div>

            <p
              v-if="errors.nextHiddenLocation"
              id="nextHiddenLocationError"
              class="errorMessage"
            >
              {{ errors.nextHiddenLocation }}
            </p>
          </div>

          <div
            class="fieldGroup"
            :class="{ fieldGroupFirstError: firstErrorField === 'nextPhoto' }"
            data-submit-field="nextPhoto"
          >
            <label for="nextPhoto">Next tag photo</label>

            <div
              class="filePicker"
              :class="{ filePickerError: Boolean(errors.nextPhoto) }"
            >
              <input
                id="nextPhoto"
                class="fileInput"
                type="file"
                accept="image/*"
                :aria-invalid="Boolean(errors.nextPhoto)"
                aria-describedby="nextPhotoHelp nextPhotoError"
                @change="handleNextPhotoChange"
              >

              <label class="fileButton" for="nextPhoto">
                Choose file
              </label>

              <span class="fileName">
                {{ nextPhotoName }}
              </span>
            </div>

            <p id="nextPhotoHelp" class="fieldHelp">
              Upload the photo riders will use to find the next mystery spot.
              Choose a safe, public, bike friendly place. Use an image file
              under 8 MB.
            </p>

            <p v-if="errors.nextPhoto" id="nextPhotoError" class="errorMessage">
              {{ errors.nextPhoto }}
            </p>

            <div v-if="nextPhotoPreviewUrl" class="photoPreview">
              <img
                :src="nextPhotoPreviewUrl"
                alt="Preview of new tag photo"
              >
            </div>
          </div>

          <p class="submitHint">
            {{ isFormReady
              ? 'Review everything before sending this to admins.'
              : 'Fill out the required fields, then review your tag before submitting.' }}
            The current tag will not change until an admin approves the submission.
          </p>

          <div class="stepActions">
            <button
              class="secondaryButton"
              type="button"
              @click="moveToFindStep"
            >
              Back to your find
            </button>

            <button
              class="primaryButton"
              type="button"
              :disabled="isSubmitting"
              @click="moveToReviewStep"
            >
              {{ isFormReady ? 'Review tag' : 'Check required fields' }}
            </button>
          </div>
        </section>
      </form>
    </div>
  </main>
</template>

<style scoped>
.submitGuide {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  display: grid;
  gap: 1rem;
  line-height: 1.6;
  margin-top: 1.5rem;
  padding: 1.25rem;
}

.submitGuide h2 {
  color: var(--color-text);
  font-size: 1.35rem;
  line-height: 1.2;
  margin: 0.25rem 0 0;
}

.guideList {
  color: var(--color-muted);
  display: grid;
  gap: 0.5rem;
  margin: 0;
  padding-left: 1.25rem;
}

.submitStepper {
  display: grid;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.stepperItem {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  cursor: pointer;
  display: grid;
  gap: 0.35rem;
  padding: 1rem;
  text-align: left;
}

.stepperItemActive {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-focus);
}

.stepperItemComplete {
  background: var(--color-primary-soft);
}

.stepperStatus {
  color: var(--color-accent);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.stepperItem strong {
  color: var(--color-text);
  font-size: 0.95rem;
}

.activeStepCard {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  display: grid;
  gap: 0.45rem;
  margin-top: 1rem;
  padding: 1.25rem;
}

.activeStepCard h2 {
  color: var(--color-text);
  font-size: 1.35rem;
  line-height: 1.15;
  margin: 0;
}

.activeStepCard p {
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0;
}

.warningBanner {
  background: var(--color-warning-surface);
  border: 1px solid var(--color-warning-border);
  border-radius: 1.5rem;
  color: var(--color-warning-text);
  font-weight: 800;
  line-height: 1.6;
  margin-top: 1.5rem;
  padding: 1.25rem;
}

.errorBanner {
  background: var(--color-error-surface);
  border: 1px solid var(--color-error-border);
  border-radius: 1.5rem;
  color: var(--color-error-text);
  font-weight: 800;
  line-height: 1.6;
  margin-top: 1.5rem;
  padding: 1.25rem;
}

.validationSummary {
  background: var(--color-warning-surface);
  border: 1px solid var(--color-warning-border);
  border-radius: 1.5rem;
  color: var(--color-warning-text);
  font-weight: 800;
  line-height: 1.6;
  margin-top: 1.5rem;
  padding: 1.25rem;
}

.submitForm {
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
}

.formSection {
  align-content: start;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
}

.sectionIntro {
  display: grid;
  gap: 0.4rem;
}

.sectionStep {
  color: var(--color-accent);
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  margin: 0;
  text-transform: uppercase;
}

.sectionIntro h2 {
  color: var(--color-text);
  font-size: 1.35rem;
  line-height: 1.1;
  margin: 0;
}

.sectionIntro p {
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0;
}

.fieldGroup {
  display: grid;
  gap: 0.45rem;
}

.fieldGroupFirstError {
  border-radius: 1rem;
  outline: 3px solid var(--color-focus);
  outline-offset: 0.35rem;
}

label {
  color: var(--color-text);
  font-size: 0.95rem;
  font-weight: 900;
}

input,
textarea {
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: 1rem;
  color: var(--color-text);
  font-size: 1rem;
  line-height: 1.4;
  padding: 0.95rem 1rem;
  width: 100%;
}

input {
  min-height: 3.25rem;
}

textarea {
  min-height: 7rem;
  resize: vertical;
}

input::placeholder,
textarea::placeholder {
  color: var(--color-subtle);
}

input:focus,
textarea:focus,
.filePicker:focus-within {
  border-color: var(--color-primary);
  outline: 3px solid var(--color-focus);
}

input[aria-invalid='true'],
textarea[aria-invalid='true'] {
  border-color: var(--color-error);
}

.locationCaptureCard {
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: 1rem;
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.locationCaptureCardCaptured {
  border-color: var(--color-primary);
}

.locationCaptureCardError {
  border-color: var(--color-error);
}

.locationCaptureTitle {
  color: var(--color-text);
  font-weight: 900;
  margin: 0 0 0.35rem;
}

.capturedLocationDetails {
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  display: grid;
  gap: 0.55rem;
  padding: 1rem;
}

.capturedLocationDetails p {
  align-items: start;
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
  margin: 0;
}

.capturedLocationDetails span {
  color: var(--color-muted);
  font-size: 0.85rem;
  font-weight: 800;
}

.capturedLocationDetails strong {
  color: var(--color-text);
  font-size: 0.9rem;
  overflow-wrap: anywhere;
  text-align: right;
}

.capturedLocationDetails a {
  color: var(--color-primary);
  font-weight: 900;
  margin-top: 0.25rem;
  text-decoration: underline;
  text-underline-offset: 0.2rem;
}

.locationCaptureActions {
  display: grid;
  gap: 0.75rem;
}

.textButton {
  background: transparent;
  border: 0;
  color: var(--color-primary);
  cursor: pointer;
  font: inherit;
  font-weight: 900;
  padding: 0;
  text-align: left;
}

.textButton:focus {
  border-radius: 0.5rem;
  outline: 3px solid var(--color-focus);
  outline-offset: 0.25rem;
}

.textButton:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.filePicker {
  align-items: center;
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: 1rem;
  display: flex;
  gap: 0.75rem;
  min-height: 3.25rem;
  padding: 0.6rem;
}

.filePickerError {
  border-color: var(--color-error);
}

.fileInput {
  height: 1px;
  opacity: 0;
  overflow: hidden;
  position: absolute;
  width: 1px;
}

.fileButton {
  background: var(--color-primary);
  border-radius: 999px;
  color: var(--color-primary-text);
  cursor: pointer;
  flex: 0 0 auto;
  font-size: 0.95rem;
  font-weight: 900;
  padding: 0.75rem 1rem;
}

.fileName {
  color: var(--color-muted);
  font-size: 0.95rem;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.photoPreview {
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  margin-top: 0.25rem;
  overflow: hidden;
}

.photoPreview img {
  display: block;
  height: auto;
  max-height: 280px;
  object-fit: cover;
  width: 100%;
}

.fieldHelp {
  color: var(--color-subtle);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
}

.errorMessage {
  color: var(--color-error);
  font-size: 0.9rem;
  font-weight: 700;
  margin: 0;
}

.submitHint {
  color: var(--color-subtle);
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0;
}

.stepActions {
  display: grid;
  gap: 0.75rem;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

@media (min-width: 760px) {
  .submitGuide {
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  }

  .submitStepper {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .locationCaptureActions,
  .stepActions {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
  }
}

@media (min-width: 900px) {
  .formSection {
    padding: 1.5rem;
  }
}
</style>