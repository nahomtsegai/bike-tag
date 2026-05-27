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
          Study the photo, check the clue status, and ride out when you think
          you know the spot. Once you find it, submit proof and choose the next
          mystery location.
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

            <h2>Submit your match and set the next tag.</h2>

            <p>
              Upload a matching photo, share where you found it, and add the
              next hidden location for admins to review.
            </p>
          </div>

          <NuxtLink to="/submit" class="primaryButton">
            Submit your match
          </NuxtLink>
        </section>

        <section class="currentTagActions" aria-label="Current tag next actions">
          <div class="actionCard">
            <h2>Need the rules?</h2>
            <p>
              Check how finding, submitting, clues, and admin review work before
              you ride.
            </p>

            <NuxtLink to="/rules" class="secondaryButton">
              Read rules
            </NuxtLink>
          </div>

          <div class="actionCard">
            <h2>Want the history?</h2>
            <p>
              Browse previous tags to see where the game has already been.
            </p>

            <NuxtLink to="/tags" class="secondaryButton">
              View found tags
            </NuxtLink>
          </div>

          <div class="actionCard">
            <h2>Prefer the map?</h2>
            <p>
              Open the map view to explore found tag locations around the game
              area.
            </p>

            <NuxtLink to="/map" class="secondaryButton">
              View map
            </NuxtLink>
          </div>
        </section>
      </template>

      <AppStateMessage
        v-else
        variant="empty"
        eyebrow="No current tag"
        title="No active tag found."
        message="There is not an active tag yet. Start the next round by submitting a new tag for admins to review."
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

.currentTagActions {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
}

.actionCard {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  display: grid;
  gap: 0.75rem;
  padding: 1.25rem;
}

.actionCard h2 {
  color: var(--color-text);
  font-size: 1.2rem;
  line-height: 1.15;
  margin: 0;
}

.actionCard p {
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0;
}

.actionCard .secondaryButton {
  justify-self: start;
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

  .currentTagActions {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .actionCard {
    padding: 1.5rem;
  }
}
</style>