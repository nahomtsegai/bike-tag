<script setup lang="ts">
import { useSubmitTagForm } from '../composables/useSubmitTagForm'

const {
  form,
  errors,
  formElement,
  isReviewing,
  isSubmitting,
  isCapturingFoundLocation,
  submitError,
  submitWarning,
  matchPhotoPreviewUrl,
  nextPhotoPreviewUrl,
  hasCapturedFoundLocation,
  foundLocationDisplay,
  isFormReady,
  firstErrorField,
  validationSummary,
  matchPhotoName,
  nextPhotoName,
  clearFieldError,
  clearSubmitFeedback,
  clearCapturedFoundLocation,
  captureFoundLocation,
  handleMatchPhotoChange,
  handleNextPhotoChange,
  handleReview,
  handleEdit,
  handleSubmit
} = useSubmitTagForm()
</script>

<template>
  <main class="page">
    <div class="pageContent">
      <AppHeader />

      <section class="pageHero">
        <p class="eyebrow">Submit tag</p>
        <h1 class="pageTitle">Found the tag? Claim it, then hide the next one.</h1>
        <p class="pageIntro">
          Send in your match photo, capture your current location near the found
          tag, and set the next mystery spot for riders to chase. Your
          submission goes to an admin before the current tag changes.
        </p>
      </section>

      <section class="submitGuide" aria-labelledby="submitGuideTitle">
        <div>
          <p class="eyebrow">Before you start</p>
          <h2 id="submitGuideTitle">
            You will need two photos, your current location, and one hidden map link.
          </h2>
        </div>

        <ul class="guideList">
          <li>A match photo proving you found the current tag.</li>
          <li>Your current location captured while you are near the found tag.</li>
          <li>A new photo for the next mystery spot.</li>
          <li>A hidden Google Maps link for the exact next tag location.</li>
        </ul>
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
        @edit="handleEdit"
        @submit="handleSubmit"
      />

      <form
        v-else
        ref="formElement"
        class="submitForm"
        @submit.prevent="handleReview"
      >
        <section class="formSection">
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
                  This replaces manually pasted found location links and helps
                  admins review the match.
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
              />

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
              />
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
        </section>

        <section class="formSection">
          <div class="sectionIntro">
            <p class="sectionStep">Step 2</p>
            <h2>Next tag</h2>
            <p>
              Pick the next mystery spot. The next photo may become public after
              approval, but the exact map location stays hidden from players.
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
            />
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
            :class="{ fieldGroupFirstError: firstErrorField === 'nextHiddenLocationMapUrl' }"
            data-submit-field="nextHiddenLocationMapUrl"
          >
            <label for="nextHiddenLocationMapUrl">Hidden next location map link</label>
            <input
              id="nextHiddenLocationMapUrl"
              v-model="form.nextHiddenLocationMapUrl"
              type="url"
              placeholder="Paste a Google Maps share link"
              :aria-invalid="Boolean(errors.nextHiddenLocationMapUrl)"
              aria-describedby="nextHiddenLocationMapUrlHelp nextHiddenLocationMapUrlError"
              @input="clearFieldError('nextHiddenLocationMapUrl')"
            />
            <p id="nextHiddenLocationMapUrlHelp" class="fieldHelp">
              Paste the Google Maps share link for the exact next tag location.
              Admins use this to verify the spot, but players will not see it
              while the tag is active.
            </p>
            <p
              v-if="errors.nextHiddenLocationMapUrl"
              id="nextHiddenLocationMapUrlError"
              class="errorMessage"
            >
              {{ errors.nextHiddenLocationMapUrl }}
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
              />

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
              />
            </div>
          </div>
        </section>

        <p class="submitHint">
          {{ isFormReady
            ? 'Review everything before sending this to admins.'
            : 'Fill out the required fields, then review your tag before submitting.' }}
          The current tag will not change until an admin approves the submission.
        </p>

        <button
          class="primaryButton submitButton"
          type="button"
          :disabled="isSubmitting"
          @click="handleReview"
        >
          {{ isFormReady ? 'Review tag' : 'Check required fields' }}
        </button>
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

@media (min-width: 760px) {
  .submitGuide {
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  }

  .locationCaptureActions {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
  }
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