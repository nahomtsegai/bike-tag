<script setup lang="ts">
import { markRaw, ref } from 'vue'
import { useBikeTags } from '../composables/useBikeTags'
import ThemeToggle from '../components/ThemeToggle.vue'

const { resetLocalTags } = useBikeTags()

const resetMessage = ref('')

const settingsGroups = [
  {
    id: 'preferences',
    title: 'Preferences',
    description: 'Control how Bike Tag looks and behaves on this device.',
    sections: [
      {
        id: 'theme',
        eyebrow: 'Appearance',
        title: 'Theme',
        description: 'Choose how Bike Tag should look on this device.',
        component: markRaw(ThemeToggle)
      }
    ]
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
        <p class="eyebrow">Settings</p>
        <h1>Manage Bike Tag.</h1>
        <p>
          Adjust app preferences and manage local prototype data saved on this
          device.
        </p>
      </section>

      <section class="settingsGroups" aria-label="Settings groups">
        <section
          v-for="settingsGroup in settingsGroups"
          :key="settingsGroup.id"
          class="settingsGroup"
        >
          <div class="settingsGroupHeader">
            <h2>
              {{ settingsGroup.title }}
            </h2>

            <p>
              {{ settingsGroup.description }}
            </p>
          </div>

          <div class="settingsList">
            <article
              v-for="settingSection in settingsGroup.sections"
              :key="settingSection.id"
              class="settingsPanel"
            >
              <div class="settingsPanelHeader">
                <p class="eyebrow">
                  {{ settingSection.eyebrow }}
                </p>

                <h3>
                  {{ settingSection.title }}
                </h3>

                <p>
                  {{ settingSection.description }}
                </p>
              </div>

              <component :is="settingSection.component" />
            </article>
          </div>
        </section>

        <section class="settingsGroup">
          <div class="settingsGroupHeader">
            <h2>
              Local data
            </h2>

            <p>
              Manage browser saved data and temporary prototype data.
            </p>
          </div>

          <div class="settingsList">
            <article class="settingsPanel">
              <div class="settingsPanelHeader">
                <p class="eyebrow">
                  Prototype data mode
                </p>

                <h3>
                  Mock server store
                </h3>

                <p>
                  Bike Tag is currently using an in memory mock server store.
                  Submitted tags update the API while the dev server is running.
                  Restarting the dev server resets the game back to sample data.
                </p>
              </div>
            </article>

            <article class="settingsPanel">
              <div class="settingsPanelHeader">
                <p class="eyebrow">
                  Local test data
                </p>

                <h3>
                  Reset local tags
                </h3>

                <p>
                  This prototype may still save some test data in your browser.
                  Resetting local data restores the sample game data for local
                  storage.
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
          </div>
        </section>
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

.settingsPageHeader .eyebrow {
  color: var(--color-accent);
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  margin: 0;
  text-transform: uppercase;
}

.settingsGroups {
  display: grid;
  gap: 2rem;
  margin-top: 1.5rem;
}

.settingsGroup {
  display: grid;
  gap: 1rem;
}

.settingsGroupHeader {
  display: grid;
  gap: 0.35rem;
}

.settingsGroupHeader h2 {
  color: var(--color-text);
  font-size: 1.6rem;
  line-height: 1.1;
  margin: 0;
}

.settingsGroupHeader p {
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0;
}

.settingsList {
  display: grid;
  gap: 1rem;
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

.settingsPanelHeader h3 {
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

  .settingsGroups {
    max-width: 680px;
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