<script setup lang="ts">
import { computed } from 'vue'
import { useBikeTags } from '../composables/useBikeTags'
import { createMapUrl } from '../utils/mapLinks'

const { foundTags } = useBikeTags()

const foundTagsWithLocations = computed(() => {
  return foundTags.value.filter((tag) => createMapUrl(tag.locationMapUrl))
})
</script>

<template>
  <main class="page">
    <div class="pageContent">
      <AppHeader />

      <section class="pageHero">
        <p class="eyebrow">Map</p>
        <h1 class="pageTitle">Explore found tag locations.</h1>
        <p class="pageIntro">
          Browse places where Bike Tags have already been found and open each
          location in Maps.
        </p>
      </section>

      <section class="mapList" aria-label="Found tag map locations">
        <div class="sectionHeader">
          <p class="eyebrow">Found locations</p>
          <h2>Where riders have been.</h2>
          <p>
            Active tag locations stay hidden until found. This page only shows
            locations from completed tags.
          </p>
        </div>

        <div v-if="foundTagsWithLocations.length" class="locationGrid">
          <article
            v-for="tag in foundTagsWithLocations"
            :key="tag.id"
            class="locationCard"
          >
            <div>
              <p class="status">{{ tag.status }}</p>
              <h3>{{ tag.title }}</h3>
              <p class="locationName">Found location available</p>
            </div>

            <div class="locationMeta">
              <p>Found by {{ tag.foundBy }}</p>
              <p>{{ tag.createdAt }}</p>
            </div>

            <div class="locationActions">
              <NuxtLink :to="`/tag/${tag.id}`" class="secondaryButton">
                View tag
              </NuxtLink>

              <a
                :href="createMapUrl(tag.locationMapUrl)"
                target="_blank"
                rel="noopener noreferrer"
                class="primaryButton"
              >
                Open in Maps
              </a>
            </div>
          </article>
        </div>

        <div v-else class="emptyState">
          <h3>No found locations yet</h3>
          <p>
            Once riders submit matching tags, found locations will appear here.
          </p>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.mapList {
  padding: 3rem 0 0;
}

.sectionHeader {
  max-width: 720px;
}

.sectionHeader h2 {
  color: var(--color-text);
  font-size: clamp(2rem, 8vw, 3.5rem);
  line-height: 1.05;
  margin: 0;
}

.sectionHeader p {
  color: var(--color-muted);
  font-size: 1rem;
  line-height: 1.65;
}

.locationGrid {
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
}

.locationCard {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
}

.status {
  color: var(--color-accent);
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  margin: 0;
  text-transform: uppercase;
}

.locationCard h3 {
  color: var(--color-text);
  font-size: 1.4rem;
  line-height: 1.1;
  margin: 0.5rem 0;
}

.locationName {
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0;
}

.locationMeta {
  border-top: 1px solid var(--color-border);
  display: grid;
  gap: 0.25rem;
  padding-top: 1rem;
}

.locationMeta p {
  color: var(--color-muted);
  margin: 0;
}

.locationActions {
  display: grid;
  gap: 0.75rem;
}

.emptyState {
  border: 1px dashed var(--color-border-strong);
  border-radius: 1.5rem;
  margin-top: 1.5rem;
  padding: 2rem 1.25rem;
  text-align: center;
}

.emptyState h3 {
  color: var(--color-text);
  font-size: 1.4rem;
  margin: 0 0 0.5rem;
}

.emptyState p {
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0;
}

@media (min-width: 700px) {
  .locationGrid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .locationActions {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
  }
}

@media (min-width: 1040px) {
  .locationGrid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>