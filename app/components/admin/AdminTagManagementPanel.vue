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
          <span>New tag photo URL</span>
          <input :value="openingTagImageUrl" type="url" placeholder="https://..." @input="updateImageUrl">
        </label>
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

      <p v-if="openingTagValidationMessage" class="helper-text">{{ openingTagValidationMessage }}</p>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

      <div class="button-row">
        <button
          :class="currentTag ? 'danger-button' : 'primary-button'"
          type="button"
          :disabled="currentTag ? !canReplace : !canCreateOpeningTag"
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
const confirmation = ref('')
const errorMessage = ref('')

const isBusy = computed(() => isLoading.value || isReplacing.value || props.isCreatingOpeningTag)
const pendingCopy = computed(() => `${pendingCount.value} pending ${pendingCount.value === 1 ? 'submission' : 'submissions'} will be superseded.`)
const canReplace = computed(() => props.canCreateOpeningTag && isAdminTagReplacementConfirmed(confirmation.value) && !isBusy.value)
const buttonLabel = computed(() => {
  if (!currentTag.value) return props.createOpeningTagButtonLabel
  if (isReplacing.value) return 'Replacing current tag...'
  if (!isAdminTagReplacementConfirmed(confirmation.value)) return `Type ${confirmationText}`
  return props.openingTagValidationMessage ? 'Complete required fields' : 'Replace current tag'
})

const inputValue = (event: Event) => event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement ? event.target.value : ''
const updateTitle = (event: Event) => emit('update:openingTagTitle', inputValue(event))
const updateClue = (event: Event) => emit('update:openingTagClue', inputValue(event))
const updateImageUrl = (event: Event) => emit('update:openingTagImageUrl', inputValue(event))
const updateMapUrl = (event: Event) => emit('update:openingTagHiddenLocationMapUrl', inputValue(event))

const clearForm = () => {
  confirmation.value = ''
  errorMessage.value = ''
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

const replaceCurrent = async () => {
  if (!currentTag.value) return
  if (props.openingTagValidationMessage) {
    errorMessage.value = props.openingTagValidationMessage
    return
  }
  if (!isAdminTagReplacementConfirmed(confirmation.value)) {
    errorMessage.value = `Type ${confirmationText} to confirm.`
    return
  }
  if (!window.confirm(`Replace ${currentTag.value.title}? ${pendingCopy.value}`)) return

  isReplacing.value = true
  errorMessage.value = ''
  try {
    await replaceAdminCurrentTag({
      title: props.openingTagTitle.trim(),
      clue: props.openingTagClue.trim(),
      imageUrl: props.openingTagImageUrl.trim(),
      hiddenLocationMapUrl: props.openingTagHiddenLocationMapUrl.trim(),
      confirmation: confirmation.value
    })
    emit('clear')
    window.location.reload()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not replace current tag.'
  } finally {
    isReplacing.value = false
  }
}

const submit = async () => currentTag.value ? replaceCurrent() : emit('create')

watch(() => props.isCreatingOpeningTag, (value, previous) => {
  if (previous && !value) void loadState()
})

onMounted(() => void loadState())
</script>

<style scoped>
.tag-panel{display:grid;gap:1rem}.section-header{align-items:start;display:flex;gap:1rem;justify-content:space-between}.current-summary{align-items:center;background:#f8fafc;border:1px solid rgba(148,163,184,.28);border-radius:1rem;display:grid;gap:1rem;grid-template-columns:8rem 1fr;padding:1rem}.current-summary img{aspect-ratio:4/3;border-radius:.75rem;object-fit:cover;width:100%}.current-summary h3{margin:.25rem 0 0}.pending-copy{color:#9a3412;font-weight:900}.opening-tag-grid{display:grid;gap:1rem}.opening-tag-grid .field+.field,.form-field{margin-top:0}.confirmation-field{background:#fff7ed;border-radius:1rem;padding:1rem}input,textarea{background:#fff;border:1px solid rgba(100,116,139,.38);border-radius:999px;color:#0f172a;font:inherit;padding:.85rem 1rem;width:100%}textarea{border-radius:1rem;min-height:7rem;resize:vertical}@media(min-width:700px){.opening-tag-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:640px){.section-header{display:grid}.current-summary{grid-template-columns:1fr}}
</style>
