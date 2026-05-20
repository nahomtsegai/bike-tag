<script setup lang="ts">
import { markRaw, ref } from 'vue'
import { useBikeTags } from '../composables/useBikeTags'
import ThemeToggle from '../components/ThemeToggle.vue'

const { resetLocalTags } = useBikeTags()

const resetMessage = ref('')

const settingsSections = [
  {
    id: 'theme',
    eyebrow: 'Appearance',
    title: 'Theme',
    description: 'Choose how Bike Tag should look on this device.',
    component: markRaw(ThemeToggle)
  }
]

const handleResetLocalTags = () => {
  if (!import.meta.client) {
    return
  }

  const shouldReset = window.confirm(
    'Reset local tags? This will remove your locally submitted tags and restore sample data.'
  )

  if (!shouldReset) {
    return
  }

  resetLocalTags()
  resetMessage.value = 'Local tags were reset to the sample game data.'
}
</script>

<template>
  <main class="page">
    <div class="pageContent">
      <AppHeader />

      <section class="settingsPageHeader">
        <h1>Settings</h1>
        <p>
          Manage app preferences for this device.
        </p>
      </section>

      <section class="settingsList" aria-label="Settings sections">
        <article
          v-for="settingSection in settingsSections"
          :key="settingSection.id"
          class="settingsPanel"
        >
          <div class="settingsPanelHeader">
            <p class="eyebrow">
              {{ settingSection.eyebrow }}
            </p>

            <h2>
              {{ settingSection.title }}
            </h2>

            <p>
              {{ settingSection.description }}
            </p>
          </div>

          <component :is="settingSection.component" />
        </article>

        <article class="settingsPanel">
          <div class="settingsPanelHeader">
            <p class="eyebrow">
              Local test data
            </p>

            <h2>
              Reset local tags
            </h2>

            <p>
              This prototype saves tags in your browser. Resetting local data
              restores the sample game data.
            </p>
          </div>

          <div class="resetActions">
            <button
              class="dangerButton"
              type="button"
              @click="handleResetLocalTags"
            >
              Reset local tags
            </button>

            <p
              v-if="resetMessage"
              class="resetMessage"
              role="status"
            >
              {{ resetMessage }}
            </p>
          </div>
        </article>
      </section>
    </div>
  </main>
</template>

<style scoped>
.settingsPageHeader {
  display: grid;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.settingsPageHeader h1 {
  color: var(--color-text);
  font-size: clamp(2.25rem, 11vw, 4rem);
  line-height: 0.95;
  margin: 0;
}

.settingsPageHeader p {
  color: var(--color-muted);
  font-size: 1rem;
  line-height: 1.6;
  margin: 0;
}

.settingsList {
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
}

.settingsPanel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  display: grid;
  gap: 1.25rem;
  padding: 1.25rem;
}

.settingsPanelHeader {
  display: grid;
  gap: 0.45rem;
}

.settingsPanelHeader h2 {
  color: var(--color-text);
  font-size: 1.35rem;
  line-height: 1.1;
  margin: 0;
}

.settingsPanelHeader p {
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0;
}

.settingsPanelHeader .eyebrow {
  color: var(--color-accent);
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  margin: 0;
  text-transform: uppercase;
}

.resetActions {
  display: grid;
  gap: 0.75rem;
}

.dangerButton {
  background: var(--color-error-surface);
  border: 1px solid var(--color-error-border);
  border-radius: 999px;
  color: var(--color-error-text);
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 900;
  min-height: 3rem;
  padding: 0.75rem 1rem;
  width: 100%;
}

.dangerButton:hover {
  border-color: var(--color-error);
}

.dangerButton:focus {
  border-color: var(--color-error);
  outline: 3px solid var(--color-focus);
}

.resetMessage {
  color: var(--color-muted);
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0;
}

@media (min-width: 760px) {
  .settingsPageHeader {
    margin-top: 2rem;
  }

  .settingsList {
    max-width: 620px;
  }

  .settingsPanel {
    padding: 1.5rem;
  }

  .dangerButton {
    justify-self: start;
    width: auto;
  }
}
</style>