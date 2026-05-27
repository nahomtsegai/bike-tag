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
        description:
          'Choose light, dark, or system theme. This only changes how Bike Tag looks on this device.',
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
        <h1>Customize Bike Tag.</h1>
        <p>
          Adjust your app preferences for this device. These settings make the
          interface feel better for you without changing the live game.
        </p>
      </section>

      <section class="settingsIntro" aria-label="Settings overview">
        <div class="settingsIntroCard">
          <h2>Device preferences</h2>
          <p>
            Settings are saved locally in this browser. They do not affect other
            riders or change tag submissions.
          </p>
        </div>

        <div class="settingsIntroCard">
          <h2>More options later</h2>
          <p>
            Theme is the first preference here. Future options can live in this
            same settings structure.
          </p>
        </div>
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

.settingsIntro {
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
}

.settingsIntroCard {
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  display: grid;
  gap: 0.75rem;
  padding: 1.25rem;
}

.settingsIntroCard h2 {
  color: var(--color-text);
  font-size: 1.2rem;
  line-height: 1.15;
  margin: 0;
}

.settingsIntroCard p {
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0;
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

  .settingsIntro {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .settingsGroups {
    max-width: 760px;
  }

  .settingsIntroCard,
  .settingsPanel {
    padding: 1.5rem;
  }
}
</style>