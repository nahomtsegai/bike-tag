<script setup lang="ts">
import { computed } from 'vue'

import { useTagApi, type CurrentTagApiResponse } from '../composables/useTagApi'
import type { BikeTag } from '../data/mockTags'

const { fetchCurrentTag } = useTagApi()

const {
  data: currentTagResponse,
  pending,
  error
} = await useAsyncData<CurrentTagApiResponse>('current-tag-page', () => {
  return fetchCurrentTag()
})

const currentTag = computed<BikeTag | undefined>(() => {
  if (!currentTagResponse.value) {
    return undefined
  }

  return {
    id: currentTagResponse.value.id,
    title: currentTagResponse.value.title,
    clue: currentTagResponse.value.clue ?? '',
    imageUrl: currentTagResponse.value.imageUrl,
    foundBy: currentTagResponse.value.foundBy,
    createdAt: currentTagResponse.value.createdAt,
    createdAtIso: currentTagResponse.value.createdAtIso,
    status: currentTagResponse.value.status
  }
})
</script>

<template>
  <main class="page">
    <div class="pageContent">
      <AppHeader />

      <section class="pageHero">
        <p class="eyebrow">Current tag</p>

        <h1 class="pageTitle">Find the current Bike Tag.</h1>

        <p class="pageIntro">
          Use the photo, timer, and game status to solve the active tag.
        </p>
      </section>

      <AppStateMessage
        v-if="pending"
        variant="loading"
        message="Loading the current tag..."
      />

      <AppStateMessage
        v-else-if="error"
        variant="error"
        title="Could not load current tag"
        message="Try refreshing the page. If this keeps happening, the tag service may need a quick check."
      />

      <template v-else-if="currentTag">
        <CurrentTagCard :tag="currentTag" />

        <section class="submitCallout" aria-label="Submit your match">
          <div>
            <p class="eyebrow">Think you found it?</p>

            <h2>Submit your matching photo.</h2>

            <p>
              Prove the current location, then set the next tag for everyone
              else to find.
            </p>
          </div>

          <NuxtLink to="/submit" class="primaryButton">
            Submit your match
          </NuxtLink>
        </section>
      </template>

      <AppStateMessage
        v-else
        variant="empty"
        eyebrow="No current tag"
        title="No active tag found."
        message="Start the next round by submitting a new tag."
        action-label="Submit a tag"
        action-to="/submit"
      />
    </div>
  </main>
</template>

<style scoped>
.submitCallout {
  align-items: start;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
  padding: 1.25rem;
}

.submitCallout h2 {
  color: var(--color-text);
  font-size: 1.5rem;
  line-height: 1.1;
  margin: 0 0 0.5rem;
}

.submitCallout p {
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0;
}

.submitCallout .primaryButton {
  align-items: center;
  display: inline-flex;
  justify-content: center;
  width: 100%;
}

@media (min-width: 760px) {
  .submitCallout {
    align-items: center;
    display: flex;
    justify-content: space-between;
    padding: 1.5rem;
  }

  .submitCallout .primaryButton {
    flex: 0 0 auto;
    width: auto;
  }
}
</style>