<script setup lang="ts">
import { markRaw } from 'vue'
import ThemeToggle from '../components/ThemeToggle.vue'

const settingsSections = [
  {
    id: 'theme',
    eyebrow: 'Appearance',
    title: 'Theme',
    description: 'Choose how Bike Tag should look on this device.',
    component: markRaw(ThemeToggle)
  }
]
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
}
</style>