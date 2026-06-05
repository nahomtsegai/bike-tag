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

const hasCapturedLocation = (tag: FoundTagApiResponse) => {
  return typeof tag.foundLatitude === 'number' &&
    typeof tag.foundLongitude === 'number'
}

const getCapturedLocationMapUrl = (tag: FoundTagApiResponse) => {
  if (!hasCapturedLocation(tag)) {
    return ''
  }

  return `https://www.google.com/maps?q=${tag.foundLatitude},${tag.foundLongitude}`
}

const getTagMapUrl = (tag: FoundTagApiResponse) => {
  return getCapturedLocationMapUrl(tag) || createMapUrl(tag.locationMapUrl)
}

const formatCoordinate = (coordinate?: number) => {
  if (typeof coordinate !== 'number') {
    return 'Not captured'
  }

  return coordinate.toFixed(6)
}

const formatAccuracy = (accuracyMeters?: number) => {
  if (typeof accuracyMeters !== 'number') {
    return 'Accuracy not available'
  }

  return `${Math.round(accuracyMeters)} meters`
}

const formatCapturedAt = (capturedAt?: string) => {
  if (!capturedAt) {
    return 'Capture time not available'
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(capturedAt))
}

const foundTagsWithLocations = computed(() => {
  return (foundTags.value ?? []).filter((tag) => {
    return Boolean(getTagMapUrl(tag))
  })
})

const foundTagsWithCapturedLocations = computed(() => {
  return foundTagsWithLocations.value.filter(hasCapturedLocation)
})

const foundLocationCount = computed(() => {
  return foundTagsWithLocations.value.length
})

const capturedLocationCount = computed(() => {
  return foundTagsWithCapturedLocations.value.length
})

const hasFoundLocations = computed(() => {
  return foundLocationCount.value > 0
})

const hasCapturedLocations = computed(() => {
  return capturedLocationCount.value > 0
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

const capturedLocationSummary = computed(() => {
  if (!hasFoundLocations.value) {
    return ''
  }

  if (capturedLocationCount.value === 0) {
    return 'No completed tags have captured coordinates yet.'
  }

  if (capturedLocationCount.value === 1) {
    return '1 location is pinned on the interactive map.'
  }

  return `${capturedLocationCount.value} locations are pinned on the interactive map.`
})

const foundTagCount = computed(() => {
  return foundTags.value?.length ?? 0
})

const mapEmptyMessage = computed(() => {
  if (foundTagCount.value > 0) {
    return 'Found tags exist, but none of them have saved map links or captured coordinates yet. Once completed tags include locations, they will appear here.'
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
          Use captured found locations and map links to revisit completed Bike
          Tag locations. Active and hidden next tag locations stay private until
          riders find them.
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
            This page shows completed tag locations. Newer approved submissions
            can appear as interactive map pins when they include captured rider
            coordinates. Older tags may only have a saved map link.
          </p>

          <p v-if="mapSummary" class="mapSummary">
            {{ mapSummary }}
          </p>

          <p v-if="capturedLocationSummary" class="mapSummary">
            {{ capturedLocationSummary }}
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

        <template v-else-if="hasFoundLocations">
          <ClientOnly>
            <FoundTagsMap
              v-if="hasCapturedLocations"
              :tags="foundTagsWithCapturedLocations"
            />

            <template #fallback>
              <AppStateMessage
                v-if="hasCapturedLocations"
                variant="loading"
                message="Loading interactive map..."
              />
            </template>
          </ClientOnly>

          <div class="locationGrid">
            <article
              v-for="tag in foundTagsWithLocations"
              :key="tag.id"
              class="locationCard"
            >
              <div>
                <div class="locationCardTopRow">
                  <p class="status">{{ tag.status }}</p>

                  <span
                    v-if="hasCapturedLocation(tag)"
                    class="mapPinBadge"
                  >
                    Pinned on map
                  </span>
                </div>

                <h3>{{ tag.title }}</h3>

                <p
                  v-if="hasCapturedLocation(tag)"
                  class="locationName"
                >
                  Captured rider location available.
                </p>

                <p
                  v-else
                  class="locationName"
                >
                  Saved map link available.
                </p>
              </div>

              <dl
                v-if="hasCapturedLocation(tag)"
                class="capturedLocationList"
              >
                <div>
                  <dt>Latitude</dt>
                  <dd>{{ formatCoordinate(tag.foundLatitude) }}</dd>
                </div>

                <div>
                  <dt>Longitude</dt>
                  <dd>{{ formatCoordinate(tag.foundLongitude) }}</dd>
                </div>

                <div>
                  <dt>Accuracy</dt>
                  <dd>{{ formatAccuracy(tag.foundLocationAccuracyMeters) }}</dd>
                </div>

                <div>
                  <dt>Captured</dt>
                  <dd>{{ formatCapturedAt(tag.foundLocationCapturedAt) }}</dd>
                </div>
              </dl>

              <p
                v-else
                class="mapLinkOnlyCopy"
              >
                This tag uses a saved map link because it was approved before
                captured rider locations were added.
              </p>

              <div class="locationMeta">
                <p>Found by {{ tag.foundBy }}</p>
                <p>{{ tag.createdAt }}</p>
              </div>

              <div class="locationActions">
                <NuxtLink :to="`/tag/${tag.id}`" class="secondaryButton">
                  View tag
                </NuxtLink>

                <a
                  v-if="getTagMapUrl(tag)"
                  :href="getTagMapUrl(tag)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="primaryButton"
                >
                  Open in Maps
                </a>
              </div>
            </article>
          </div>
        </template>

        <AppStateMessage
          v-else
          variant="empty"
          eyebrow="No map locations"
          title="No map locations yet."
          :message="mapEmptyMessage"
          action-label="View current tag"
          action-to="/current-tag"
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

.locationCardTopRow {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: space-between;
}

.status {
  color: var(--color-accent);
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  margin: 0;
  text-transform: uppercase;
}

.mapPinBadge {
  background: var(--color-primary-soft);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 900;
  padding: 0.35rem 0.65rem;
}

.locationCard h3 {
  color: var(--color-text);
  font-size: 1.4rem;
  line-height: 1.1;
  margin: 0.5rem 0;
}

.locationName {
  color: var(--color-muted);
  font-weight: 800;
  line-height: 1.6;
  margin: 0;
}

.capturedLocationList {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  display: grid;
  gap: 0.75rem;
  margin: 0;
  padding: 1rem;
}

.capturedLocationList div {
  display: grid;
  gap: 0.25rem;
}

.capturedLocationList dt {
  color: var(--color-muted);
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.capturedLocationList dd {
  color: var(--color-text);
  margin: 0;
  overflow-wrap: anywhere;
}

.mapLinkOnlyCopy {
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