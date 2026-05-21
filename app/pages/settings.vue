<script setup lang="ts">
import { computed, markRaw, ref } from 'vue'
import { useSystemApi } from '../composables/useSystemApi'
import { useTagApi } from '../composables/useTagApi'
import ThemeToggle from '../components/ThemeToggle.vue'

const { resetTags } = useTagApi()
const { fetchDataSourceStatus } = useSystemApi()

const runtimeConfig = useRuntimeConfig()

const showDevTools = computed(() => {
  return runtimeConfig.public.showDevTools === true
})

const resetMessage = ref('')

const {
  data: dataSourceStatus,
  pending: dataSourceStatusPending,
  error: dataSourceStatusError,
  refresh: refreshDataSourceStatus
} = await useAsyncData('settings-data-source-status', () => {
  return fetchDataSourceStatus()
})

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

const formatConfiguredStatus = (isConfigured?: boolean) => {
  return isConfigured ? 'Configured' : 'Not configured'
}

const handleResetMockGameData = async () => {
  if (!import.meta.client) {
    return
  }

  const shouldReset = window.confirm(
    'Reset mock game data? This will restore the sample current tag and found tag history.'
  )

  if (!shouldReset) {
    return
  }

  try {
    await resetTags()

    await refreshNuxtData([
      'current-tag-page',
      'found-tags-page',
      'found-tags-map'
    ])

    await refreshDataSourceStatus()

    resetMessage.value = 'Mock game data was reset to the sample game data.'
  } catch (error) {
    resetMessage.value = 'Mock game data could not be reset. Try again.'

    console.error(error)
  }
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

        <section v-if="showDevTools" class="settingsGroup">
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
                  Data source
                </p>

                <h3>
                  Current server mode
                </h3>

                <p>
                  View the active tag data source and confirm whether Supabase
                  runtime values are configured. Secret values are never shown.
                </p>
              </div>

              <div
                v-if="dataSourceStatusPending"
                class="statusMessage"
                role="status"
              >
                Loading data source status...
              </div>

              <div
                v-else-if="dataSourceStatusError"
                class="statusMessage"
                role="alert"
              >
                Could not load data source status.
              </div>

              <dl v-else-if="dataSourceStatus" class="statusList">
                <div>
                  <dt>Tag data source</dt>
                  <dd>{{ dataSourceStatus.tagDataSource }}</dd>
                </div>

                <div>
                  <dt>Supabase URL</dt>
                  <dd>
                    {{ formatConfiguredStatus(dataSourceStatus.supabase.hasUrl) }}
                  </dd>
                </div>

                <div>
                  <dt>Supabase service role key</dt>
                  <dd>
                    {{
                      formatConfiguredStatus(
                        dataSourceStatus.supabase.hasServiceRoleKey
                      )
                    }}
                  </dd>
                </div>

                <div>
                  <dt>Storage bucket</dt>
                  <dd>
                    {{ dataSourceStatus.supabase.storageBucket || 'Not configured' }}
                  </dd>
                </div>
              </dl>
            </article>

            <article class="settingsPanel">
              <div class="settingsPanelHeader">
                <p class="eyebrow">
                  Submit mode
                </p>

                <h3>
                  Current submit behavior
                </h3>

                <p>
                  Submit behavior follows the active tag data source. This helps
                  confirm whether new tag submissions are going to mock data or
                  Supabase.
                </p>
              </div>

              <div
                v-if="dataSourceStatusPending"
                class="statusMessage"
                role="status"
              >
                Loading submit mode...
              </div>

              <div
                v-else-if="dataSourceStatusError"
                class="statusMessage"
                role="alert"
              >
                Could not load submit mode.
              </div>

              <dl v-else-if="dataSourceStatus" class="statusList">
                <div>
                  <dt>Submit mode</dt>
                  <dd>{{ dataSourceStatus.tagDataSource }}</dd>
                </div>

                <div>
                  <dt>Submit behavior</dt>
                  <dd>
                    <template
                      v-if="dataSourceStatus.tagDataSource === 'supabase'"
                    >
                      Uploads photos to Supabase Storage and saves the tag
                      handoff to Supabase.
                    </template>

                    <template v-else>
                      Saves the tag handoff to the in memory mock server store.
                    </template>
                  </dd>
                </div>

                <div>
                  <dt>Photo uploads</dt>
                  <dd>
                    <template
                      v-if="dataSourceStatus.tagDataSource === 'supabase'"
                    >
                      Enabled through Supabase Storage.
                    </template>

                    <template v-else>
                      Not persisted. Mock mode validates photos but does not
                      store uploaded files.
                    </template>
                  </dd>
                </div>
              </dl>
            </article>

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
                  Mock game data
                </p>

                <h3>
                  Reset mock game data
                </h3>

                <p>
                  Resetting mock game data restores the sample current tag and
                  found tag history without restarting the dev server.
                </p>
              </div>

              <div class="resetActions">
                <button
                  class="dangerButton"
                  type="button"
                  @click="handleResetMockGameData"
                >
                  Reset mock game data
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

.statusList {
  border-top: 1px solid var(--color-border);
  display: grid;
  gap: 0.85rem;
  margin: 0;
  padding-top: 1rem;
}

.statusList div {
  display: grid;
  gap: 0.2rem;
}

.statusList dt {
  color: var(--color-text);
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.statusList dd {
  color: var(--color-muted);
  line-height: 1.5;
  margin: 0;
  overflow-wrap: anywhere;
}

.statusMessage {
  border: 1px dashed var(--color-border-strong);
  border-radius: 1rem;
  color: var(--color-muted);
  line-height: 1.5;
  padding: 1rem;
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