<script setup lang="ts">
import { computed } from 'vue'
import { useTagApi, type FoundTagApiResponse } from '../composables/useTagApi'
import { createMapUrl } from '../utils/mapLinks'

const { fetchFoundTags } = useTagApi()

const {
  data: foundTags,
  pending,
  error
} = await useAsyncData<FoundTagApiResponse[]>('found-tags-map', () => {
  return fetchFoundTags()
})

const foundTagsWithLocations = computed(() => {
  return (foundTags.value ?? []).filter((tag) => {
    return createMapUrl(tag.locationMapUrl)
  })
})

const foundLocationCount = computed(() => {
  return foundTagsWithLocations.value.length
})

const hasFoundLocations = computed(() => {
  return foundLocationCount.value > 0
})

const mapSummary = computed(() => {
  if (!hasFoundLocations.value) {
    return ''
  }

  if (foundLocationCount.value === 1) {
    return 'Showing 1 found tag location.'
  }

  return `Showing ${foundLocationCount.value} found tag locations.`
})

const foundTagCount = computed(() => {
  return foundTags.value?.length ?? 0
})

const mapEmptyMessage = computed(() => {
  if (foundTagCount.value > 0) {
    return 'Found tags exist, but none of them have saved map links yet. Once completed tags include locations, they will appear here.'
  }

  return 'Once riders submit matching tags and admins approve them, completed tag locations will appear here.'
})

</script>

<template>
  <main class="page">
    <div class="pageContent">
      <AppHeader />

      <section class="pageHero">
        <p class="eyebrow">Map</p>

        <h1 class="pageTitle">Explore where tags have been found.</h1>

        <p class="pageIntro">
          Use the map links to revisit completed Bike Tag locations. Active and
          hidden next tag locations stay private until riders find them.
        </p>
      </section>

      <section class="mapActions" aria-label="Map page actions">
        <div class="mapActionCard">
          <h2>Looking for the active tag?</h2>
          <p>
            Head back to the current tag page when you are ready to solve the
            live mystery spot.
          </p>

          <NuxtLink to="/current-tag" class="secondaryButton">
            View current tag
          </NuxtLink>
        </div>

        <div class="mapActionCard">
          <h2>Want the full history?</h2>
          <p>
            Browse previous tags with photos, clues, riders, dates, and status.
          </p>

          <NuxtLink to="/tags" class="secondaryButton">
            View found tags
          </NuxtLink>
        </div>
      </section>

      <section class="mapList" aria-label="Found tag map locations">
        <div class="sectionHeader">
          <p class="eyebrow">Found locations</p>

          <h2>Completed tags on the map.</h2>

          <p>
            This page only shows locations from completed tags. Open a location
            in Maps, or jump into a tag detail page for more context.
          </p>

          <p v-if="mapSummary" class="mapSummary">
            {{ mapSummary }}
          </p>
        </div>

        <AppStateMessage
          v-if="pending"
          variant="loading"
          message="Loading found locations..."
        />

        <AppStateMessage
          v-else-if="error"
          variant="error"
          title="Could not load found locations"
          message="Try refreshing the page. If this keeps happening, the tag map may need a quick check."
        />

        <div v-else-if="hasFoundLocations" class="locationGrid">
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

        <AppStateMessage
          v-else
          variant="empty"
          eyebrow="No map locations"
          title="No map locations yet."
          :message="mapEmptyMessage"
          action-label="View found tags"
          action-to="/tags"
        />
      </section>
    </div>
  </main>
</template>

<style scoped>
.mapActions {
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
}

.mapActionCard {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  display: grid;
  gap: 0.75rem;
  padding: 1.25rem;
}

.mapActionCard h2 {
  color: var(--color-text);
  font-size: 1.2rem;
  line-height: 1.15;
  margin: 0;
}

.mapActionCard p {
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0;
}

.mapActionCard .secondaryButton {
  justify-self: start;
}

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

.mapSummary {
  font-weight: 800;
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

@media (min-width: 700px) {
  .mapActions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .mapActionCard {
    padding: 1.5rem;
  }

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