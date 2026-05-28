<script setup lang="ts">
import { useSubmitTagForm } from '../composables/useSubmitTagForm'

const {
  form,
  errors,
  formElement,
  isReviewing,
  isSubmitting,
  submitError,
  submitWarning,
  matchPhotoPreviewUrl,
  nextPhotoPreviewUrl,
  isFormReady,
  firstErrorField,
  validationSummary,
  matchPhotoName,
  nextPhotoName,
  clearFieldError,
  clearSubmitFeedback,
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
          Send in your match photo, the location where you found the current tag,
          and the next mystery spot for riders to chase. Your submission goes to
          an admin before the current tag changes.
        </p>
      </section>

      <section class="submitGuide" aria-labelledby="submitGuideTitle">
        <div>
          <p class="eyebrow">Before you start</p>
          <h2 id="submitGuideTitle">You will need two photos and two map links.</h2>
        </div>

        <ul class="guideList">
          <li>A match photo proving you found the current tag.</li>
          <li>A Google Maps link for where the current tag was found.</li>
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
              Tell us who found the current tag, where it was found, and upload
              a clear photo showing your bike at the matching spot.
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
            :class="{ fieldGroupFirstError: firstErrorField === 'findLocationMapUrl' }"
            data-submit-field="findLocationMapUrl"
          >
            <label for="findLocationMapUrl">Found location map link</label>
            <input
              id="findLocationMapUrl"
              v-model="form.findLocationMapUrl"
              type="url"
              placeholder="Paste a Google Maps share link"
              :aria-invalid="Boolean(errors.findLocationMapUrl)"
              aria-describedby="findLocationMapUrlHelp findLocationMapUrlError"
              @input="clearFieldError('findLocationMapUrl')"
            />
            <p id="findLocationMapUrlHelp" class="fieldHelp">
              Open Google Maps, choose the spot where you found the current tag,
              tap share, and paste the public link here. This is only used for
              admin review.
            </p>
            <p
              v-if="errors.findLocationMapUrl"
              id="findLocationMapUrlError"
              class="errorMessage"
            >
              {{ errors.findLocationMapUrl }}
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