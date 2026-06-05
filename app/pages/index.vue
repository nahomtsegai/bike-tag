<script setup lang="ts">
import { computed } from 'vue'

import {
  useTagApi,
  type CurrentTagApiPayload
} from '../composables/useTagApi'

const { fetchCurrentTag } = useTagApi()

const {
  data: currentTagResponse
} = await useAsyncData<CurrentTagApiPayload>('home-current-tag', () => {
  return fetchCurrentTag()
})

const hasCurrentTag = computed(() => {
  return Boolean(currentTagResponse.value?.currentTag)
})
</script>

<template>
  <main class="page">
    <div class="pageContent">
      <AppHeader />

      <section class="pageHero">
        <p class="eyebrow">Bike Tag</p>
        <h1 class="pageTitle">Ride, find, tag, repeat.</h1>
        <p class="pageIntro">
          Bike Tag is a rolling photo hunt. Find the current mystery spot,
          prove it with your bike, then choose the next location for everyone
          else to chase.
        </p>

        <div class="heroActions">
          <NuxtLink to="/current-tag" class="primaryButton">
            View current tag
          </NuxtLink>

          <NuxtLink to="/rules" class="secondaryButton">
            Learn how it works
          </NuxtLink>
        </div>
      </section>

      <section class="howItWorks" aria-label="How Bike Tag works">
        <article class="stepCard">
          <span>1</span>

          <div>
            <h2>Find the spot</h2>
            <p>
              Study the current tag photo, ride out, and match the location.
            </p>
          </div>
        </article>

        <article class="stepCard">
          <span>2</span>

          <div>
            <h2>Submit proof</h2>
            <p>
              Upload your matching bike photo and found location for admin
              review.
            </p>
          </div>
        </article>

        <article class="stepCard">
          <span>3</span>

          <div>
            <h2>Hide the next tag</h2>
            <p>
              Pick the next mystery location, add a photo, and write a hidden
              clue.
            </p>
          </div>
        </article>
      </section>

      <section class="dashboardGrid" aria-label="Bike Tag dashboard">
        <NuxtLink to="/current-tag" class="dashboardCard primaryCard">
          <p class="eyebrow">Play</p>
          <h2>Current tag</h2>
          <p>
            View the active tag, check the timer, and see whether the clue has
            unlocked.
          </p>
        </NuxtLink>

        <NuxtLink
          v-if="hasCurrentTag"
          to="/submit"
          class="dashboardCard"
        >
          <p class="eyebrow">Found it?</p>
          <h2>Submit tag</h2>
          <p>
            Upload your matching photo, confirm the map link, and hide the next
            tag.
          </p>
        </NuxtLink>

        <NuxtLink
          v-else
          to="/rules"
          class="dashboardCard"
        >
          <p class="eyebrow">Game setup</p>
          <h2>No active tag yet</h2>
          <p>
            The game is ready, but the first Bike Tag has not been created yet.
            Read the rules while the opening tag gets set up.
          </p>
        </NuxtLink>

        <NuxtLink to="/tags" class="dashboardCard">
          <p class="eyebrow">History</p>
          <h2>Previous tags</h2>
          <p>
            Browse completed tags and revisit the clues, photos, and riders who
            found them.
          </p>
        </NuxtLink>

        <NuxtLink to="/map" class="dashboardCard">
          <p class="eyebrow">Locations</p>
          <h2>Map</h2>
          <p>
            Open found tag locations in Maps while active tag locations stay
            hidden.
          </p>
        </NuxtLink>
      </section>
    </div>
  </main>
</template>

<style scoped>
.heroActions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.heroActions .primaryButton,
.heroActions .secondaryButton {
  align-items: center;
  display: inline-flex;
  justify-content: center;
  width: 100%;
}

.howItWorks {
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
}

.stepCard {
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  display: grid;
  gap: 1rem;
  grid-template-columns: auto 1fr;
  padding: 1.25rem;
}

.stepCard span {
  align-items: center;
  background: var(--color-primary);
  border-radius: 999px;
  color: var(--color-primary-text);
  display: inline-flex;
  font-weight: 900;
  height: 2rem;
  justify-content: center;
  width: 2rem;
}

.stepCard h2 {
  color: var(--color-text);
  font-size: 1.2rem;
  line-height: 1.15;
  margin: 0 0 0.4rem;
}

.stepCard p {
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0;
}

.dashboardGrid {
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
}

.dashboardCard {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  color: inherit;
  display: grid;
  gap: 0.75rem;
  padding: 1.25rem;
  text-decoration: none;
}

.dashboardCard:hover {
  border-color: var(--color-primary);
}

.dashboardCard:focus {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}

.primaryCard {
  background: var(--color-surface-soft);
}

.dashboardCard h2 {
  color: var(--color-text);
  font-size: 1.75rem;
  line-height: 1.1;
  margin: 0;
}

.dashboardCard p {
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0;
}

.dashboardCard .eyebrow {
  color: var(--color-accent);
}

@media (min-width: 640px) {
  .heroActions .primaryButton,
  .heroActions .secondaryButton {
    width: auto;
  }
}

@media (min-width: 760px) {
  .howItWorks {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .dashboardGrid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .stepCard,
  .dashboardCard {
    padding: 1.5rem;
  }
}
</style>