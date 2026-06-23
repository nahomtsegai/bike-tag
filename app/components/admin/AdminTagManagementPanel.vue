<template>
  <section class="admin-card tag-panel">
    <div class="section-header">
      <div>
        <p class="eyebrow">Tag management</p>
        <h2>{{ currentTag ? 'Replace current tag' : 'Create first tag' }}</h2>
      </div>
      <button class="secondary-button" type="button" :disabled="isBusy" @click="void loadState()">Refresh</button>
    </div>

    <AppStateMessage v-if="isLoading" variant="loading" message="Loading current tag..." />

    <template v-else>
      <div v-if="currentTag" class="current-summary">
        <img :src="currentTag.imageUrl" :alt="currentTag.title">
        <div>
          <p class="eyebrow">Active now</p>
          <h3>{{ currentTag.title }}</h3>
          <p class="pending-copy">{{ pendingCopy }}</p>
        </div>
      </div>

      <p class="helper-text">
        {{ currentTag
          ? 'The old tag will be preserved as replaced. Pending submissions will be superseded automatically.'
          : 'Create the opening mystery spot when no active tag exists.' }}
      </p>

      <div class="opening-tag-grid">
        <label class="field">
          <span>New tag title</span>
          <input :value="openingTagTitle" maxlength="80" @input="updateTitle">
        </label>
        <label class="field">
          <span>New tag photo URL (optional)</span>
          <input
            :value="openingTagImageUrl"
            type="url"
            placeholder="https://..."
            @input="updateImageUrl"
          >
        </label>
      </div>

      <div class="photo-picker">
        <div>
          <p class="field-label">New tag photo</p>
          <p class="helper-text photo-helper">
            Choose an existing image, take a new photo, or paste a photo URL above.
          </p>
        </div>

        <div class="photo-action-row">
          <button
            class="secondary-button"
            type="button"
            :disabled="isBusy"
            @click="galleryPhotoInput?.click()"
          >
            Choose photo
          </button>
          <button
            class="secondary-button"
            type="button"
            :disabled="isBusy"
            @click="cameraPhotoInput?.click()"
          >
            Take photo
          </button>
        </div>

        <input
          ref="galleryPhotoInput"
          class="hidden-file-input"
          type="file"
          :accept="adminTagPhotoAccept"
          :disabled="isBusy"
          @change="void handlePhotoSelection($event)"
        >
        <input
          ref="cameraPhotoInput"
          class="hidden-file-input"
          type="file"
          :accept="adminTagPhotoAccept"
          capture="environment"
          :disabled="isBusy"
          @change="void handlePhotoSelection($event)"
        >

        <div v-if="selectedPhotoFile" class="selected-photo">
          <img :src="selectedPhotoPreviewUrl" alt="Selected new tag photo preview">
          <div class="selected-photo-copy">
            <strong>{{ selectedPhotoFile.name }}</strong>
            <span>{{ formatFileSize(selectedPhotoFile.size) }}</span>
          </div>
          <button
            class="secondary-button"
            type="button"
            :disabled="isBusy"
            @click="clearSelectedPhoto"
          >
            Remove
          </button>
        </div>

        <p v-else-if="isPreparingPhoto" class="helper-text">
          Preparing selected photo...
        </p>
      </div>

      <label class="field form-field">
        <span>New tag clue</span>
        <textarea :value="openingTagClue" rows="4" maxlength="500" @input="updateClue" />
      </label>

      <label class="field form-field">
        <span>New hidden location map URL</span>
        <input :value="openingTagHiddenLocationMapUrl" type="url" @input="updateMapUrl">
      </label>

      <label v-if="currentTag" class="field confirmation-field">
        <span>Type {{ confirmationText }} to confirm</span>
        <input v-model="confirmation" autocomplete="off" :placeholder="confirmationText">
      </label>

      <p v-if="localValidationMessage" class="helper-text">{{ localValidationMessage }}</p>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      <p v-if="successMessage" class="success-message">{{ successMessage }}</p>

      <div class="button-row">
        <button
          :class="currentTag ? 'danger-button' : 'primary-button'"
          type="button"
          :disabled="currentTag ? !canReplace : !canCreate"
          @click="void submit()"
        >
          {{ buttonLabel }}
        </button>
        <button class="secondary-button" type="button" :disabled="isBusy" @click="clearForm">Clear form</button>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import type { CurrentTagApiResponse } from '~/composables/useTagApi'
import { getAdminCurrentTagState, replaceAdminCurrentTag } from '~/utils/adminCurrentTagApi'
import { createAdminOpeningTag } from '~/utils/adminOpeningTagApi'
import {
  adminTagPhotoAccept,
  prepareAdminTagPhotoFile
} from '~/utils/adminTagPhoto'
import { adminTagReplacementConfirmationText as confirmationText, isAdminTagReplacementConfirmed } from '~~/shared/utils/adminTagReplacement'

const props = defineProps<{
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

const currentTag = ref<CurrentTagApiResponse | null>(null)
const pendingCount = ref(0)
const isLoading = ref(true)
const isReplacing = ref(false)
const isCreating = ref(false)
const isPreparingPhoto = ref(false)
const confirmation = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const selectedPhotoFile = shallowRef<File | null>(null)
const selectedPhotoPreviewUrl = ref('')
const galleryPhotoInput = ref<HTMLInputElement | null>(null)
const cameraPhotoInput = ref<HTMLInputElement | null>(null)

const isBusy = computed(() =>
  isLoading.value ||
  isReplacing.value ||
  isCreating.value ||
  isPreparingPhoto.value ||
  props.isCreatingOpeningTag
)
const pendingCopy = computed(() => `${pendingCount.value} pending ${pendingCount.value === 1 ? 'submission' : 'submissions'} will be superseded.`)

const isValidHttpUrl = (value: string) => {
  try {
    const url = new URL(value.trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const localValidationMessage = computed(() => {
  if (!props.openingTagTitle.trim()) return 'New tag title is required.'

  if (!selectedPhotoFile.value && !props.openingTagImageUrl.trim()) {
    return 'Choose a photo, take a photo, or enter a photo URL.'
  }

  if (
    !selectedPhotoFile.value &&
    !isValidHttpUrl(props.openingTagImageUrl)
  ) {
    return 'New tag photo URL must start with http:// or https://.'
  }

  if (!props.openingTagClue.trim()) return 'New tag clue is required.'

  if (!props.openingTagHiddenLocationMapUrl.trim()) {
    return 'Hidden location map URL is required.'
  }

  if (!isValidHttpUrl(props.openingTagHiddenLocationMapUrl)) {
    return 'Hidden location map URL must start with http:// or https://.'
  }

  return ''
})

const canCreate = computed(() => !localValidationMessage.value && !isBusy.value)
const canReplace = computed(() => canCreate.value && isAdminTagReplacementConfirmed(confirmation.value))
const buttonLabel = computed(() => {
  if (isPreparingPhoto.value) return 'Preparing photo...'
  if (!currentTag.value) {
    if (isCreating.value) return 'Creating opening tag...'
    return localValidationMessage.value ? 'Complete required fields' : 'Create opening tag'
  }
  if (isReplacing.value) return 'Replacing current tag...'
  if (!isAdminTagReplacementConfirmed(confirmation.value)) return `Type ${confirmationText}`
  return localValidationMessage.value ? 'Complete required fields' : 'Replace current tag'
})

const inputValue = (event: Event) => event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement ? event.target.value : ''
const updateTitle = (event: Event) => emit('update:openingTagTitle', inputValue(event))
const updateClue = (event: Event) => emit('update:openingTagClue', inputValue(event))
const updateMapUrl = (event: Event) => emit('update:openingTagHiddenLocationMapUrl', inputValue(event))

const clearPhotoPreview = () => {
  if (selectedPhotoPreviewUrl.value) {
    URL.revokeObjectURL(selectedPhotoPreviewUrl.value)
    selectedPhotoPreviewUrl.value = ''
  }
}

const clearSelectedPhoto = () => {
  clearPhotoPreview()
  selectedPhotoFile.value = null
}

const updateImageUrl = (event: Event) => {
  const value = inputValue(event)
  if (value.trim()) clearSelectedPhoto()
  emit('update:openingTagImageUrl', value)
}

const setSelectedPhoto = (file: File) => {
  clearPhotoPreview()
  selectedPhotoFile.value = file
  selectedPhotoPreviewUrl.value = URL.createObjectURL(file)
  emit('update:openingTagImageUrl', '')
}

const handlePhotoSelection = async (event: Event) => {
  if (!(event.target instanceof HTMLInputElement)) return

  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return

  isPreparingPhoto.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    setSelectedPhoto(await prepareAdminTagPhotoFile(file))
  } catch (error) {
    clearSelectedPhoto()
    errorMessage.value = error instanceof Error
      ? error.message
      : 'Could not prepare the selected photo.'
  } finally {
    isPreparingPhoto.value = false
  }
}

const formatFileSize = (size: number) => {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

const clearForm = () => {
  confirmation.value = ''
  errorMessage.value = ''
  successMessage.value = ''
  clearSelectedPhoto()
  emit('clear')
}

const loadState = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const response = await getAdminCurrentTagState()
    currentTag.value = response.currentTag
    pendingCount.value = response.pendingSubmissionCount
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not load current tag.'
  } finally {
    isLoading.value = false
  }
}

const createOpening = async () => {
  if (localValidationMessage.value) {
    errorMessage.value = localValidationMessage.value
    return
  }

  isCreating.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await createAdminOpeningTag({
      title: props.openingTagTitle.trim(),
      clue: props.openingTagClue.trim(),
      imageUrl: props.openingTagImageUrl.trim(),
      hiddenLocationMapUrl: props.openingTagHiddenLocationMapUrl.trim(),
      photoFile: selectedPhotoFile.value
    })

    currentTag.value = response.currentTag
    pendingCount.value = 0
    successMessage.value = response.message
    clearSelectedPhoto()
    emit('clear')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not create the opening tag.'
  } finally {
    isCreating.value = false
  }
}

const replaceCurrent = async () => {
  if (!currentTag.value) return
  if (localValidationMessage.value) {
    errorMessage.value = localValidationMessage.value
    return
  }
  if (!isAdminTagReplacementConfirmed(confirmation.value)) {
    errorMessage.value = `Type ${confirmationText} to confirm.`
    return
  }
  if (!window.confirm(`Replace ${currentTag.value.title}? ${pendingCopy.value}`)) return

  isReplacing.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const response = await replaceAdminCurrentTag({
      title: props.openingTagTitle.trim(),
      clue: props.openingTagClue.trim(),
      imageUrl: props.openingTagImageUrl.trim(),
      hiddenLocationMapUrl: props.openingTagHiddenLocationMapUrl.trim(),
      confirmation: confirmation.value,
      photoFile: selectedPhotoFile.value
    })

    currentTag.value = response.currentTag
    pendingCount.value = 0
    confirmation.value = ''
    successMessage.value = response.message
    clearSelectedPhoto()
    emit('clear')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not replace current tag.'
  } finally {
    isReplacing.value = false
  }
}

const submit = async () => currentTag.value ? replaceCurrent() : createOpening()

watch(() => props.isCreatingOpeningTag, (value, previous) => {
  if (previous && !value) void loadState()
})

onMounted(() => void loadState())
onBeforeUnmount(clearPhotoPreview)
</script>

<style scoped>
.tag-panel{display:grid;gap:1rem}.section-header{align-items:start;display:flex;gap:1rem;justify-content:space-between}.current-summary{align-items:center;background:#f8fafc;border:1px solid rgba(148,163,184,.28);border-radius:1rem;display:grid;gap:1rem;grid-template-columns:8rem 1fr;padding:1rem}.current-summary img{aspect-ratio:4/3;border-radius:.75rem;object-fit:cover;width:100%}.current-summary h3{margin:.25rem 0 0}.pending-copy{color:#9a3412;font-weight:900}.opening-tag-grid{display:grid;gap:1rem}.opening-tag-grid .field+.field,.form-field{margin-top:0}.confirmation-field{background:#fff7ed;border-radius:1rem;padding:1rem}.photo-picker{background:#f8fafc;border:1px dashed rgba(100,116,139,.42);border-radius:1rem;display:grid;gap:.85rem;padding:1rem}.field-label{color:#0f172a;font-weight:900;margin:0}.photo-helper{margin:.25rem 0 0}.photo-action-row{display:flex;flex-wrap:wrap;gap:.75rem}.hidden-file-input{display:none}.selected-photo{align-items:center;background:#fff;border:1px solid rgba(148,163,184,.28);border-radius:1rem;display:grid;gap:1rem;grid-template-columns:6rem minmax(0,1fr) auto;padding:.75rem}.selected-photo img{aspect-ratio:4/3;border-radius:.75rem;object-fit:cover;width:100%}.selected-photo-copy{display:grid;gap:.25rem;min-width:0}.selected-photo-copy strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.selected-photo-copy span{color:#64748b;font-size:.9rem}input,textarea{background:#fff;border:1px solid rgba(100,116,139,.38);border-radius:999px;color:#0f172a;font:inherit;padding:.85rem 1rem;width:100%}textarea{border-radius:1rem;min-height:7rem;resize:vertical}@media(min-width:700px){.opening-tag-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:640px){.section-header{display:grid}.current-summary{grid-template-columns:1fr}.selected-photo{grid-template-columns:5rem minmax(0,1fr)}.selected-photo .secondary-button{grid-column:1/-1}}
</style>
