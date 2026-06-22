<script setup lang="ts">
import {
  maximumClueUnlockDelayDays,
  minimumClueUnlockDelayDays,
  isValidClueUnlockDelayDays
} from '~~/shared/utils/clueUnlock'
import { getAdminApiErrorMessage } from '~/utils/adminApiErrors'
import {
  getAdminGameSettings,
  updateAdminGameSettings
} from '~/utils/adminGameSettingsApi'

const clueUnlockDelayDays = ref<number | null>(null)
const savedClueUnlockDelayDays = ref<number | null>(null)
const updatedAtIso = ref('')
const isLoading = ref(true)
const isSaving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const validationMessage = computed(() => {
  if (!isValidClueUnlockDelayDays(clueUnlockDelayDays.value)) {
    return `Enter a whole number from ${minimumClueUnlockDelayDays} to ${maximumClueUnlockDelayDays}.`
  }

  return ''
})

const hasUnsavedChanges = computed(() => {
  return clueUnlockDelayDays.value !== savedClueUnlockDelayDays.value
})

const canSave = computed(() => {
  return (
    !isLoading.value &&
    !isSaving.value &&
    !validationMessage.value &&
    hasUnsavedChanges.value
  )
})

const updatedAtLabel = computed(() => {
  if (!updatedAtIso.value) {
    return 'Not available'
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(updatedAtIso.value))
})

const setSettings = ({
  clueUnlockDelayDays: nextDelay,
  updatedAtIso: nextUpdatedAtIso
}: {
  clueUnlockDelayDays: number
  updatedAtIso: string
}) => {
  clueUnlockDelayDays.value = nextDelay
  savedClueUnlockDelayDays.value = nextDelay
  updatedAtIso.value = nextUpdatedAtIso
}

const handleDelayInput = (event: Event) => {
  const value = (event.target as HTMLInputElement).value
  clueUnlockDelayDays.value = value === '' ? null : Number(value)
  successMessage.value = ''
}

const loadSettings = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await getAdminGameSettings()
    setSettings(response.settings)
  } catch (error) {
    errorMessage.value = getAdminApiErrorMessage(error)
  } finally {
    isLoading.value = false
  }
}

const saveSettings = async () => {
  if (!canSave.value || !isValidClueUnlockDelayDays(clueUnlockDelayDays.value)) {
    errorMessage.value = validationMessage.value || 'Change the delay before saving.'
    successMessage.value = ''
    return
  }

  isSaving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await updateAdminGameSettings({
      clueUnlockDelayDays: clueUnlockDelayDays.value
    })

    setSettings(response.settings)
    successMessage.value = response.message
  } catch (error) {
    errorMessage.value = getAdminApiErrorMessage(error)
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  void loadSettings()
})
</script>

<template>
  <section class="admin-card settings-card">
    <div class="section-header">
      <div>
        <p class="eyebrow">Game timing</p>
        <h2>Clue reveal delay</h2>
      </div>

      <button
        class="secondary-button"
        type="button"
        :disabled="isLoading || isSaving"
        @click="void loadSettings()"
      >
        Refresh
      </button>
    </div>

    <AppStateMessage
      v-if="isLoading"
      variant="loading"
      message="Loading game settings..."
    />

    <form v-else class="settings-form" @submit.prevent="void saveSettings()">
      <label class="field delay-field">
        <span>Days before the clue appears</span>
        <input
          :value="clueUnlockDelayDays ?? ''"
          type="number"
          :min="minimumClueUnlockDelayDays"
          :max="maximumClueUnlockDelayDays"
          step="1"
          inputmode="numeric"
          @input="handleDelayInput"
        >
      </label>

      <p class="helper-text">
        Use 0 to reveal clues immediately. New tags created after this setting is
        saved will use the updated delay. The current active tag keeps its existing
        unlock time.
      </p>

      <dl class="settings-summary">
        <div>
          <dt>Saved delay</dt>
          <dd>{{ savedClueUnlockDelayDays }} days</dd>
        </div>

        <div>
          <dt>Last updated</dt>
          <dd>{{ updatedAtLabel }}</dd>
        </div>
      </dl>

      <p v-if="validationMessage" class="error-message">
        {{ validationMessage }}
      </p>

      <p v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </p>

      <p v-if="successMessage" class="success-message" role="status">
        {{ successMessage }}
      </p>

      <div class="button-row">
        <button class="primary-button" type="submit" :disabled="!canSave">
          {{ isSaving ? 'Saving...' : 'Save clue delay' }}
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.settings-card {
  display: grid;
  gap: 1.25rem;
}

.section-header {
  align-items: start;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}

.section-header h2 {
  color: #0f172a;
  font-size: 1.5rem;
  margin: 0.25rem 0 0;
}

.settings-form {
  display: grid;
  gap: 1rem;
}

.delay-field {
  margin: 0;
  max-width: 22rem;
}

.delay-field input {
  background: #fff;
  border: 1px solid rgba(100, 116, 139, 0.38);
  border-radius: 0.85rem;
  color: #0f172a;
  font: inherit;
  font-weight: 800;
  padding: 0.8rem 0.9rem;
  width: 100%;
}

.settings-summary {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
}

.settings-summary div {
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 1rem;
  padding: 1rem;
}

.settings-summary dt {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.settings-summary dd {
  color: #0f172a;
  font-weight: 900;
  margin: 0.35rem 0 0;
}

@media (max-width: 560px) {
  .section-header {
    display: grid;
  }

  .settings-summary {
    grid-template-columns: 1fr;
  }
}
</style>
