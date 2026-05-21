<script setup lang="ts">
import { markRaw } from 'vue'
import ThemeToggle from '../components/ThemeToggle.vue'

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
</script>

<template>
  <main class="page">
    <div class="pageContent">
      <AppHeader />

      <section class="settingsPageHeader">
        <p class="eyebrow">Settings</p>
        <h1>Manage Bike Tag.</h1>
        <p>
          Adjust app preferences for this device.
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
}
</style>